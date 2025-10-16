import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import { Readable } from 'stream'
import { HeaderProcessor } from './header-processor.js'
import { PathProcessor } from './path-processor.js'

export interface HttpProxyOptions {
  sourceBaseUrl: string
  targetBaseUrl: string
  pathRewrite?: (sourcePath: string) => string
  headers?: (originalHeaders: OutgoingHttpHeaders) => OutgoingHttpHeaders
  cookies?: (originalCookies: string[]) => string[]
  responseCookies?: (responseCookies: string[]) => string[]
  timeout?: number
  onError?: (error: { from: string; to: string; error: unknown }) => void
}

/**
 * Handles HTTP request proxying with streaming support
 */
export class HttpProxyHandler {
  private readonly headerProcessor = new HeaderProcessor()
  private readonly pathProcessor = new PathProcessor()

  constructor(private readonly options: HttpProxyOptions) {}

  /**
   * Sets up abort controller and timeout for request cancellation
   */
  private setupAbortHandling(
    req: IncomingMessage,
    res: ServerResponse,
    timeoutMs: number,
  ): { abortController: AbortController; timeoutId: NodeJS.Timeout } {
    const abortController = new AbortController()

    const abortUpstream = () => {
      try {
        abortController.abort()
      } catch {
        // Ignore abort errors
      }
      // Clean up listeners to prevent memory leaks
      res.off('close', abortUpstream)
      req.off('aborted', abortUpstream)
    }

    res.once('close', abortUpstream)
    req.once('aborted', abortUpstream)

    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)

    return { abortController, timeoutId }
  }

  /**
   * Extracts Set-Cookie headers from the response, handling both standard and undici formats
   */
  private extractSetCookieHeaders(proxyResponse: Response): string[] {
    const setCookieHeaders: string[] = []
    const anyHeaders = proxyResponse.headers as unknown as { getSetCookie?: () => string[] }
    const fromGetter = anyHeaders.getSetCookie?.()

    if (fromGetter && Array.isArray(fromGetter) && fromGetter.length) {
      setCookieHeaders.push(...fromGetter)
    } else {
      proxyResponse.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          setCookieHeaders.push(value)
        }
      })
    }

    return setCookieHeaders
  }

  /**
   * Copies response headers from proxy response to client response
   */
  private copyResponseHeaders(proxyResponse: Response, res: ServerResponse): void {
    proxyResponse.headers.forEach((value, key) => {
      if (!this.headerProcessor.isHopByHopHeader(key)) {
        if (key.toLowerCase() !== 'set-cookie') {
          res.setHeader(key, value)
        }
      }
    })
  }

  /**
   * Handles Set-Cookie headers with optional transformation
   */
  private handleSetCookieHeaders(setCookieHeaders: string[], res: ServerResponse): void {
    if (setCookieHeaders.length > 0) {
      const finalSetCookies = this.options.responseCookies
        ? this.options.responseCookies(setCookieHeaders)
        : setCookieHeaders
      res.setHeader('set-cookie', finalSetCookies)
    }
  }

  /**
   * Streams the response body from proxy to client
   */
  private async streamResponseBody(proxyResponse: Response, res: ServerResponse): Promise<void> {
    if (!proxyResponse.body) {
      res.end()
      return
    }

    const reader = proxyResponse.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!res.write(value)) {
          await new Promise((resolve) => res.once('drain', resolve))
        }
      }
      res.end()
    } catch (error) {
      try {
        await reader.cancel()
      } catch {
        // Ignore cancel errors
      }
      if (!res.destroyed) {
        res.destroy()
      }
      throw error
    }
  }

  /**
   * Handles proxy errors and sends appropriate response to client
   */
  private handleProxyError(error: unknown, res: ServerResponse): void {
    if (this.options.onError) {
      this.options.onError({
        from: this.options.sourceBaseUrl,
        to: this.options.targetBaseUrl,
        error,
      })
    }

    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' })
      res.end('Bad Gateway')
    } else if (!res.destroyed) {
      res.destroy()
    }
  }

  /**
   * Main handler for proxying HTTP requests
   */
  public async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      // Build target URL
      const targetUrl = this.pathProcessor.processUrl(
        req.url as string,
        this.options.sourceBaseUrl,
        this.options.targetBaseUrl,
        this.options.pathRewrite,
      )

      const parsedTargetUrl = new URL(targetUrl)

      // Process headers
      const { proxyHeaders } = this.headerProcessor.processRequestHeaders(req, parsedTargetUrl.host, {
        headers: this.options.headers,
        cookies: this.options.cookies,
      })

      // Set up timeout and abort handling
      const timeoutMs = this.options.timeout ?? 30000
      const { abortController, timeoutId } = this.setupAbortHandling(req, res, timeoutMs)

      try {
        // Make the proxy request
        const proxyResponse = await fetch(targetUrl, {
          method: req.method,
          headers: proxyHeaders,
          body:
            req.method !== 'GET' && req.method !== 'HEAD'
              ? (Readable.toWeb(req) as ReadableStream<Uint8Array>)
              : undefined,
          // @ts-expect-error - duplex is not in the types yet, but required for streaming bodies
          duplex: 'half',
          signal: abortController.signal,
        })
        clearTimeout(timeoutId)

        // Extract and handle Set-Cookie headers
        const setCookieHeaders = this.extractSetCookieHeaders(proxyResponse)

        // Copy other response headers
        this.copyResponseHeaders(proxyResponse, res)

        // Handle Set-Cookie headers with transformation
        this.handleSetCookieHeaders(setCookieHeaders, res)

        // Set status code
        res.writeHead(proxyResponse.status, res.getHeaders())

        // Stream the response body
        await this.streamResponseBody(proxyResponse, res)
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    } catch (error) {
      this.handleProxyError(error, res)
    }
  }
}
