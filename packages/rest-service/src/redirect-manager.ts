import { Injectable, Injected } from '@furystack/inject'
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import { ServerManager } from './server-manager.js'

export interface ProxyOptions {
  sourceBaseUrl: string
  sourcePath: string
  targetBaseUrl: string
  pathRewrite?: (sourcePath: string) => string
  sourceHostName?: string
  sourcePort: number
  headers?: (originalHeaders: OutgoingHttpHeaders) => OutgoingHttpHeaders
  cookies?: (originalCookies: string[]) => string[]
}

@Injectable({ lifetime: 'singleton' })
export class ProxyManager {
  @Injected(ServerManager)
  private declare readonly serverManager: ServerManager

  public shouldExec =
    (sourceBaseUrl: string) =>
    ({ req }: { req: Pick<IncomingMessage, 'url' | 'method'> }) =>
      req.url &&
      (req.url === sourceBaseUrl ||
        req.url.startsWith(sourceBaseUrl[sourceBaseUrl.length - 1] === '/' ? sourceBaseUrl : `${sourceBaseUrl}/`))
        ? true
        : false

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

      // Get original headers
      const originalHeaders: OutgoingHttpHeaders = {}
      Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          originalHeaders[key] = value
        } else if (Array.isArray(value)) {
          originalHeaders[key] = value.join(', ')
        }
      })

      // Transform headers if provided
      const finalHeaders = headers ? headers(originalHeaders) : originalHeaders

      // Get original cookies
      const originalCookies = req.headers.cookie ? req.headers.cookie.split(';').map((c) => c.trim()) : []

      // Transform cookies if provided
      const finalCookies = cookies ? cookies(originalCookies) : originalCookies

      // Prepare headers for the proxy request
      const proxyHeaders: OutgoingHttpHeaders = {
        ...finalHeaders,
        Host: new URL(targetUrl).host,
        'User-Agent': req.headers['user-agent'] || 'FuryStack-Proxy/1.0',
      }

      // Add cookies if transformed
      if (finalCookies.length > 0) {
        proxyHeaders.Cookie = finalCookies.join('; ')
      }

      try {
        // Make the proxy request
        const proxyResponse = await fetch(targetUrl, {
          method: req.method,
          headers: proxyHeaders,
          body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
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
          pump()
        } else {
          res.end()
        }
      } catch (error) {
        res.writeHead(502, { 'Content-Type': 'text/plain' })
        res.end('Bad Gateway')
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
