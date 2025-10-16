import { Injectable, Injected } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import { ServerManager } from './server-manager.js'

export interface ProxyOptions {
  sourceBaseUrl: string
  targetBaseUrl: string
  pathRewrite?: (sourcePath: string) => string
  sourceHostName?: string
  sourcePort: number
  headers?: (originalHeaders: OutgoingHttpHeaders) => OutgoingHttpHeaders
  cookies?: (originalCookies: string[]) => string[]
  responseCookies?: (responseCookies: string[]) => string[]
}

// Headers that should not be forwarded to the target server
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

@Injectable({ lifetime: 'singleton' })
export class ProxyManager extends EventHub<{ onProxyFailed: { from: string; to: string; error: unknown } }> {
  @Injected(ServerManager)
  private declare readonly serverManager: ServerManager

  public shouldExec =
    (sourceBaseUrl: string) =>
    ({ req }: { req: Pick<IncomingMessage, 'url' | 'method'> }) =>
      req.url?.startsWith(sourceBaseUrl) ?? false

  private filterHeaders(headers: OutgoingHttpHeaders): OutgoingHttpHeaders {
    const filtered: OutgoingHttpHeaders = {}
    for (const [key, value] of Object.entries(headers)) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        filtered[key] = value
      }
    }
    return filtered
  }

  private onRequest = ({
    sourceBaseUrl,
    targetBaseUrl,
    pathRewrite,
    headers,
    cookies,
    responseCookies,
  }: {
    sourceBaseUrl: string
    targetBaseUrl: string
    pathRewrite?: (sourcePath: string) => string
    headers?: (originalHeaders: OutgoingHttpHeaders) => OutgoingHttpHeaders
    cookies?: (originalCookies: string[]) => string[]
    responseCookies?: (responseCookiesList: string[]) => string[]
  }) => {
    return async ({ req, res }: { req: IncomingMessage; res: ServerResponse }) => {
      try {
        // Extract the path part after the source base URL, including query string
        const sourceUrl = req.url as string
        const sourceUrlPath = sourceUrl.substring(sourceBaseUrl.length)

        // Apply path rewrite if provided, otherwise use the source path as-is
        const targetPath = pathRewrite ? pathRewrite(sourceUrlPath) : sourceUrlPath

        // Build the target URL
        const targetUrl = `${targetBaseUrl}${targetPath}`

        // Validate target URL
        try {
          new URL(targetUrl)
        } catch {
          throw new Error(`Invalid target URL: ${targetUrl}`)
        }

        // Process headers - filter hop-by-hop headers
        const originalHeaders: OutgoingHttpHeaders = {}
        for (const [key, value] of Object.entries(req.headers)) {
          originalHeaders[key] = Array.isArray(value) ? value.join(', ') : value
        }

        const filteredHeaders = this.filterHeaders(originalHeaders)
        const finalHeaders = headers ? headers(filteredHeaders) : filteredHeaders

        // Process cookies
        const originalCookies = req.headers.cookie?.split(';').map((c) => c.trim()) ?? []
        const finalCookies = cookies ? cookies(originalCookies) : originalCookies

        // Build proxy headers, excluding hop-by-hop headers
        const proxyHeaders: Record<string, string> = {
          ...Object.fromEntries(
            Object.entries(finalHeaders).filter(
              ([key, value]) => typeof value === 'string' && !HOP_BY_HOP_HEADERS.has(key.toLowerCase()),
            ),
          ),
          Host: new URL(targetUrl).host,
          'User-Agent': req.headers['user-agent'] || 'FuryStack-Proxy/1.0',
        }

        if (finalCookies.length > 0) {
          proxyHeaders.Cookie = finalCookies.join('; ')
        }

        // Read request body for non-GET/HEAD requests (preserve as Uint8Array for binary content)
        let requestBody: Uint8Array | undefined
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
          }
          requestBody = Buffer.concat(chunks)
        }

        // Make the proxy request
        const proxyResponse = await fetch(targetUrl, {
          method: req.method,
          headers: proxyHeaders,
          body: requestBody as BodyInit | null | undefined,
        })

        // Copy and filter response headers
        const setCookieHeaders: string[] = []
        proxyResponse.headers.forEach((value, key) => {
          const lowerKey = key.toLowerCase()
          if (!HOP_BY_HOP_HEADERS.has(lowerKey)) {
            if (lowerKey === 'set-cookie') {
              setCookieHeaders.push(value)
            } else {
              res.setHeader(key, value)
            }
          }
        })

        // Handle Set-Cookie header transformation
        if (setCookieHeaders.length > 0) {
          const finalSetCookies = responseCookies ? responseCookies(setCookieHeaders) : setCookieHeaders
          res.setHeader('set-cookie', finalSetCookies)
        }

        // Set status code
        res.writeHead(proxyResponse.status, res.getHeaders())

        // Stream the response body
        if (proxyResponse.body) {
          const reader = proxyResponse.body.getReader()
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              if (!res.write(value)) {
                // Handle backpressure
                await new Promise((resolve) => res.once('drain', resolve))
              }
            }
            res.end()
          } catch (error) {
            await reader.cancel()
            if (!res.destroyed) {
              res.destroy()
            }
            throw error
          }
        } else {
          res.end()
        }
      } catch (error) {
        this.emit('onProxyFailed', { from: sourceBaseUrl, to: `${targetBaseUrl}`, error })
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'text/plain' })
          res.end('Bad Gateway')
        } else if (!res.destroyed) {
          res.destroy()
        }
      }
    }
  }

  public async addProxy(options: ProxyOptions) {
    // Validate targetBaseUrl format - only check if it can be parsed as URL
    let url: URL
    try {
      url = new URL(options.targetBaseUrl)
    } catch (error) {
      throw new Error(
        `Invalid targetBaseUrl: ${options.targetBaseUrl}${error instanceof Error ? ` (${error.message})` : ''}`,
      )
    }

    // Check protocol
    if (!url.protocol.startsWith('http')) {
      throw new Error(`Invalid targetBaseUrl protocol: ${url.protocol} (must be http or https)`)
    }

    const server = await this.serverManager.getOrCreate({ hostName: options.sourceHostName, port: options.sourcePort })

    server.apis.push({
      shouldExec: this.shouldExec(options.sourceBaseUrl),
      onRequest: this.onRequest({
        sourceBaseUrl: options.sourceBaseUrl,
        targetBaseUrl: options.targetBaseUrl,
        pathRewrite: options.pathRewrite,
        headers: options.headers,
        cookies: options.cookies,
        responseCookies: options.responseCookies,
      }),
    })
  }
}
