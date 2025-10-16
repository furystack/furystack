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
}

@Injectable({ lifetime: 'singleton' })
export class ProxyManager extends EventHub<{ onRedirectFailed: { from: string; to: string; error: unknown } }> {
  @Injected(ServerManager)
  private declare readonly serverManager: ServerManager

  public shouldExec =
    (sourceBaseUrl: string) =>
    ({ req }: { req: Pick<IncomingMessage, 'url' | 'method'> }) =>
      req.url?.startsWith(sourceBaseUrl) ?? false

  private onRequest = ({
    sourceBaseUrl,
    targetBaseUrl,
    pathRewrite,
    headers,
    cookies,
  }: {
    sourceBaseUrl: string
    targetBaseUrl: string
    pathRewrite?: (sourcePath: string) => string
    headers?: (originalHeaders: OutgoingHttpHeaders) => OutgoingHttpHeaders
    cookies?: (originalCookies: string[]) => string[]
  }) => {
    return async ({ req, res }: { req: IncomingMessage; res: ServerResponse }) => {
      // Extract the path part after the source base URL
      const sourceUrlPath = (req.url as string).substring(sourceBaseUrl.length)

      // Apply path rewrite if provided, otherwise use the source path as-is
      const targetPath = pathRewrite ? pathRewrite(sourceUrlPath) : sourceUrlPath

      // Build the target URL
      const targetUrl = `${targetBaseUrl}${targetPath}`

      // Process headers
      const originalHeaders: OutgoingHttpHeaders = {}
      for (const [key, value] of Object.entries(req.headers)) {
        originalHeaders[key] = Array.isArray(value) ? value.join(', ') : value
      }

      const finalHeaders = headers ? headers(originalHeaders) : originalHeaders

      // Process cookies
      const originalCookies = req.headers.cookie?.split(';').map((c) => c.trim()) ?? []
      const finalCookies = cookies ? cookies(originalCookies) : originalCookies

      // Build proxy headers
      const proxyHeaders: Record<string, string> = {
        ...Object.fromEntries(Object.entries(finalHeaders).filter(([, value]) => typeof value === 'string')),
        Host: new URL(targetUrl).host,
        'User-Agent': req.headers['user-agent'] || 'FuryStack-Proxy/1.0',
      }

      if (finalCookies.length > 0) {
        proxyHeaders.Cookie = finalCookies.join('; ')
      }

      try {
        // Read request body for non-GET/HEAD requests
        let requestBody: string | undefined
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array))
          }
          requestBody = Buffer.concat(chunks).toString('utf8')
        }

        // Make the proxy request
        const proxyResponse = await fetch(targetUrl, {
          method: req.method,
          headers: proxyHeaders,
          body: requestBody,
        })

        // Copy response headers
        proxyResponse.headers.forEach((value, key) => {
          res.setHeader(key, value)
        })

        // Set status code
        res.writeHead(proxyResponse.status, res.getHeaders())

        // Stream the response body
        if (proxyResponse.body) {
          const reader = proxyResponse.body.getReader()
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                res.write(value)
              }
              res.end()
            } catch (error) {
              res.destroy()
            }
          }
          await pump()
        } else {
          res.end()
        }
      } catch (error) {
        this.emit('onRedirectFailed', { from: sourceBaseUrl, to: targetUrl, error })
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'text/plain' })
          res.end('Bad Gateway')
        }
      }
    }
  }

  public async addProxy(options: ProxyOptions) {
    const server = await this.serverManager.getOrCreate({ hostName: options.sourceHostName, port: options.sourcePort })

    server.apis.push({
      shouldExec: this.shouldExec(options.sourceBaseUrl),
      onRequest: this.onRequest({
        sourceBaseUrl: options.sourceBaseUrl,
        targetBaseUrl: options.targetBaseUrl,
        pathRewrite: options.pathRewrite,
        headers: options.headers,
        cookies: options.cookies,
      }),
    })
  }
}
