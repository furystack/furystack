import { Injectable, Injected } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import type { Duplex } from 'stream'
import { Readable } from 'stream'
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
  timeout?: number
  enableWebsockets?: boolean
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
export class ProxyManager extends EventHub<{
  onProxyFailed: { from: string; to: string; error: unknown }
  onWebSocketProxyFailed: { from: string; to: string; error: unknown }
}> {
  @Injected(ServerManager)
  private declare readonly serverManager: ServerManager

  public shouldExec =
    (sourceBaseUrl: string) =>
    ({ req }: { req: Pick<IncomingMessage, 'url' | 'method'> }) =>
      req.url
        ? req.url === sourceBaseUrl ||
          req.url.startsWith(sourceBaseUrl[sourceBaseUrl.length - 1] === '/' ? sourceBaseUrl : `${sourceBaseUrl}/`)
        : false

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
    timeout,
  }: {
    sourceBaseUrl: string
    targetBaseUrl: string
    pathRewrite?: (sourcePath: string) => string
    headers?: (originalHeaders: OutgoingHttpHeaders) => OutgoingHttpHeaders
    cookies?: (originalCookies: string[]) => string[]
    responseCookies?: (responseCookiesList: string[]) => string[]
    timeout?: number
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

        // Build proxy headers, excluding hop-by-hop headers and removing any existing cookie header
        const headersWithoutCookie: Record<string, string> = {}
        for (const [key, value] of Object.entries(finalHeaders)) {
          const lowerKey = key.toLowerCase()
          if (lowerKey !== 'cookie' && !HOP_BY_HOP_HEADERS.has(lowerKey)) {
            if (typeof value === 'string') {
              headersWithoutCookie[key] = value
            } else if (typeof value === 'number') {
              headersWithoutCookie[key] = value.toString()
            } else if (Array.isArray(value)) {
              headersWithoutCookie[key] = value.join(', ')
            }
            // undefined is intentionally skipped
          }
        }

        // X-Forwarded-* headers
        const forwardedFor = [
          (req.headers['x-forwarded-for'] as string | undefined)
            ?.split(',')
            .map((s) => s.trim())
            .filter(Boolean) ?? [],
          [req.socket.remoteAddress ?? ''],
        ]
          .flat()
          .filter(Boolean)
          .join(', ')

        const proxyHeaders: Record<string, string> = {
          ...headersWithoutCookie,
          Host: new URL(targetUrl).host,
          'User-Agent': (req.headers['user-agent'] as string) || 'FuryStack-Proxy/1.0',
          'X-Forwarded-For': forwardedFor,
          'X-Forwarded-Host': (req.headers.host as string) || '',
          'X-Forwarded-Proto':
            (req.headers['x-forwarded-proto'] as string) ||
            ((req.socket as { encrypted?: boolean }).encrypted ? 'https' : 'http'),
        }

        if (finalCookies.length > 0) {
          proxyHeaders.Cookie = finalCookies.join('; ')
        }

        // Prepare abort controller to cancel upstream when client disconnects
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

        // Set up timeout
        const timeoutMs = timeout ?? 30000
        const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)

        try {
          // Make the proxy request, stream request body when applicable
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

          // Copy and filter response headers
          const setCookieHeaders: string[] = []
          // Prefer undici's getSetCookie if available to correctly read multiple cookies
          const anyHeaders = proxyResponse.headers as unknown as { getSetCookie?: () => string[] }
          const fromGetter = anyHeaders.getSetCookie?.()
          if (fromGetter && Array.isArray(fromGetter) && fromGetter.length) {
            setCookieHeaders.push(...fromGetter)
            proxyResponse.headers.forEach((value, key) => {
              if (key.toLowerCase() !== 'set-cookie' && !HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
                res.setHeader(key, value)
              }
            })
          } else {
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
          }

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
                  await new Promise((resolve) => res.once('drain', resolve))
                }
              }
              res.end()
            } catch (error) {
              clearTimeout(timeoutId)
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
          } else {
            res.end()
          }
        } catch (error) {
          clearTimeout(timeoutId)
          this.emit('onProxyFailed', { from: sourceBaseUrl, to: `${targetBaseUrl}`, error })
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' })
            res.end('Bad Gateway')
          } else if (!res.destroyed) {
            res.destroy()
          }
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

  private onUpgrade = ({
    sourceBaseUrl,
    targetBaseUrl,
    pathRewrite,
    headers,
    timeout,
  }: {
    sourceBaseUrl: string
    targetBaseUrl: string
    pathRewrite?: (sourcePath: string) => string
    headers?: (originalHeaders: OutgoingHttpHeaders) => OutgoingHttpHeaders
    timeout?: number
  }) => {
    return async ({ req, socket, head }: { req: IncomingMessage; socket: Duplex; head: Buffer }) => {
      try {
        // Extract the path part after the source base URL, including query string
        const sourceUrl = req.url as string
        const sourceUrlPath = sourceUrl.substring(sourceBaseUrl.length)

        // Apply path rewrite if provided, otherwise use the source path as-is
        const targetPath = pathRewrite ? pathRewrite(sourceUrlPath) : sourceUrlPath

        // Build the target URL
        const targetUrl = `${targetBaseUrl}${targetPath}`

        // Validate target URL
        let parsedTargetUrl: URL
        try {
          parsedTargetUrl = new URL(targetUrl)
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

        // Build WebSocket upgrade headers
        const upgradeHeaders: Record<string, string> = {}
        for (const [key, value] of Object.entries(finalHeaders)) {
          const lowerKey = key.toLowerCase()
          if (!HOP_BY_HOP_HEADERS.has(lowerKey)) {
            if (typeof value === 'string') {
              upgradeHeaders[key] = value
            } else if (typeof value === 'number') {
              upgradeHeaders[key] = value.toString()
            } else if (Array.isArray(value)) {
              upgradeHeaders[key] = value.join(', ')
            }
          }
        }

        // Add required WebSocket upgrade headers
        upgradeHeaders.Host = parsedTargetUrl.host
        upgradeHeaders.Connection = 'Upgrade'
        upgradeHeaders.Upgrade = 'websocket'
        upgradeHeaders['Sec-WebSocket-Version'] = req.headers['sec-websocket-version'] as string
        upgradeHeaders['Sec-WebSocket-Key'] = req.headers['sec-websocket-key'] as string

        // Add optional WebSocket headers
        if (req.headers['sec-websocket-protocol']) {
          upgradeHeaders['Sec-WebSocket-Protocol'] = req.headers['sec-websocket-protocol']
        }
        if (req.headers['sec-websocket-extensions']) {
          upgradeHeaders['Sec-WebSocket-Extensions'] = req.headers['sec-websocket-extensions']
        }

        // Set up timeout
        const timeoutMs = timeout ?? 30000
        const timeoutId = setTimeout(() => {
          socket.destroy()
        }, timeoutMs)

        // Create upgrade request to target server
        const requestFn = parsedTargetUrl.protocol === 'https:' ? httpsRequest : httpRequest
        const proxyReq = requestFn({
          host: parsedTargetUrl.hostname,
          port: parsedTargetUrl.port || (parsedTargetUrl.protocol === 'https:' ? 443 : 80),
          path: parsedTargetUrl.pathname + parsedTargetUrl.search,
          method: 'GET',
          headers: upgradeHeaders,
        })

        proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
          clearTimeout(timeoutId)

          // Write the upgrade response to the client socket
          const headers = [`HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage}`]
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            if (Array.isArray(value)) {
              value.forEach((v) => headers.push(`${key}: ${v}`))
            } else {
              headers.push(`${key}: ${value}`)
            }
          }
          headers.push('', '')
          socket.write(headers.join('\r\n'))

          // Write the initial data
          if (proxyHead.length > 0) {
            socket.write(proxyHead)
          }
          if (head.length > 0) {
            proxySocket.write(head)
          }

          // Bidirectional pipe
          proxySocket.pipe(socket)
          socket.pipe(proxySocket)

          // Handle errors and cleanup
          const cleanup = () => {
            proxySocket.destroy()
            socket.destroy()
          }

          proxySocket.on('error', (error) => {
            this.emit('onWebSocketProxyFailed', { from: sourceBaseUrl, to: targetBaseUrl, error })
            cleanup()
          })

          socket.on('error', (error) => {
            this.emit('onWebSocketProxyFailed', { from: sourceBaseUrl, to: targetBaseUrl, error })
            cleanup()
          })

          proxySocket.on('close', () => {
            socket.destroy()
          })

          socket.on('close', () => {
            proxySocket.destroy()
          })
        })

        proxyReq.on('error', (error) => {
          clearTimeout(timeoutId)
          this.emit('onWebSocketProxyFailed', { from: sourceBaseUrl, to: targetBaseUrl, error })
          socket.destroy()
        })

        proxyReq.on('timeout', () => {
          clearTimeout(timeoutId)
          const timeoutError = new Error('WebSocket upgrade timeout')
          this.emit('onWebSocketProxyFailed', { from: sourceBaseUrl, to: targetBaseUrl, error: timeoutError })
          proxyReq.destroy()
          socket.destroy()
        })

        proxyReq.end()
      } catch (error) {
        this.emit('onWebSocketProxyFailed', { from: sourceBaseUrl, to: targetBaseUrl, error })
        socket.destroy()
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

    const api = {
      shouldExec: this.shouldExec(options.sourceBaseUrl),
      onRequest: this.onRequest({
        sourceBaseUrl: options.sourceBaseUrl,
        targetBaseUrl: options.targetBaseUrl,
        pathRewrite: options.pathRewrite,
        headers: options.headers,
        cookies: options.cookies,
        responseCookies: options.responseCookies,
        timeout: options.timeout,
      }),
      ...(options.enableWebsockets
        ? {
            onUpgrade: this.onUpgrade({
              sourceBaseUrl: options.sourceBaseUrl,
              targetBaseUrl: options.targetBaseUrl,
              pathRewrite: options.pathRewrite,
              headers: options.headers,
              timeout: options.timeout,
            }),
          }
        : {}),
    }

    server.apis.push(api)
  }
}
