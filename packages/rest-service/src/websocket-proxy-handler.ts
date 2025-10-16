import type { IncomingMessage, OutgoingHttpHeaders } from 'http'
import { request as httpRequest } from 'http'
import { request as httpsRequest } from 'https'
import type { Duplex } from 'stream'
import { HeaderProcessor } from './header-processor.js'
import { PathProcessor } from './path-processor.js'

export interface WebSocketProxyOptions {
  sourceBaseUrl: string
  targetBaseUrl: string
  pathRewrite?: (sourcePath: string) => string
  headers?: (originalHeaders: OutgoingHttpHeaders) => OutgoingHttpHeaders
  timeout?: number
  onError?: (error: { from: string; to: string; error: unknown }) => void
}

/**
 * Handles WebSocket upgrade proxying with bidirectional streaming
 */
export class WebSocketProxyHandler {
  private readonly headerProcessor = new HeaderProcessor()
  private readonly pathProcessor = new PathProcessor()

  constructor(private readonly options: WebSocketProxyOptions) {}

  /**
   * Builds WebSocket-specific upgrade headers
   */
  private buildUpgradeHeaders(
    req: IncomingMessage,
    targetHost: string,
    finalHeaders: OutgoingHttpHeaders,
  ): Record<string, string> {
    const upgradeHeaders = this.headerProcessor.convertHeadersToRecord(finalHeaders)

    // Add required WebSocket upgrade headers
    upgradeHeaders.Host = targetHost
    upgradeHeaders.Connection = 'Upgrade'
    upgradeHeaders.Upgrade = 'websocket'
    upgradeHeaders['Sec-WebSocket-Version'] = req.headers['sec-websocket-version'] as string
    upgradeHeaders['Sec-WebSocket-Key'] = req.headers['sec-websocket-key'] as string

    // Add optional WebSocket headers
    if (req.headers['sec-websocket-protocol']) {
      upgradeHeaders['Sec-WebSocket-Protocol'] = req.headers['sec-websocket-protocol'] as string
    }
    if (req.headers['sec-websocket-extensions']) {
      upgradeHeaders['Sec-WebSocket-Extensions'] = req.headers['sec-websocket-extensions'] as string
    }

    return upgradeHeaders
  }

  /**
   * Writes the upgrade response headers to the client socket
   */
  private writeUpgradeResponse(socket: Duplex, proxyRes: IncomingMessage): void {
    const responseHeaders = [`HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage}`]
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (Array.isArray(value)) {
        value.forEach((v) => responseHeaders.push(`${key}: ${v}`))
      } else {
        responseHeaders.push(`${key}: ${value}`)
      }
    }
    responseHeaders.push('', '')
    socket.write(responseHeaders.join('\r\n'))
  }

  /**
   * Sets up bidirectional piping between client and target sockets with error handling
   */
  private setupBidirectionalPipe(
    clientSocket: Duplex,
    proxySocket: Duplex,
    clientHead: Buffer,
    proxyHead: Buffer,
  ): void {
    // Write initial data
    if (proxyHead.length > 0) {
      clientSocket.write(proxyHead)
    }
    if (clientHead.length > 0) {
      proxySocket.write(clientHead)
    }

    // Bidirectional pipe
    proxySocket.pipe(clientSocket)
    clientSocket.pipe(proxySocket)

    // Handle errors and cleanup
    const cleanup = () => {
      proxySocket.destroy()
      clientSocket.destroy()
    }

    const handleError = (error: Error) => {
      if (this.options.onError) {
        this.options.onError({
          from: this.options.sourceBaseUrl,
          to: this.options.targetBaseUrl,
          error,
        })
      }
      cleanup()
    }

    proxySocket.on('error', handleError)
    clientSocket.on('error', handleError)

    proxySocket.on('close', () => {
      clientSocket.destroy()
    })

    clientSocket.on('close', () => {
      proxySocket.destroy()
    })
  }

  /**
   * Handles WebSocket upgrade errors
   */
  private handleUpgradeError(error: unknown, socket: Duplex): void {
    if (this.options.onError) {
      this.options.onError({
        from: this.options.sourceBaseUrl,
        to: this.options.targetBaseUrl,
        error,
      })
    }
    socket.destroy()
  }

  /**
   * Main handler for WebSocket upgrade requests
   */
  public async handle(req: IncomingMessage, socket: Duplex, head: Buffer): Promise<void> {
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
      const originalHeaders: OutgoingHttpHeaders = {}
      for (const [key, value] of Object.entries(req.headers)) {
        originalHeaders[key] = Array.isArray(value) ? value.join(', ') : value
      }

      const filteredHeaders = this.headerProcessor.filterHeaders(originalHeaders)
      const finalHeaders = this.options.headers ? this.options.headers(filteredHeaders) : filteredHeaders

      // Build WebSocket upgrade headers
      const upgradeHeaders = this.buildUpgradeHeaders(req, parsedTargetUrl.host, finalHeaders)

      // Set up timeout
      const timeoutMs = this.options.timeout ?? 30000
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
        this.writeUpgradeResponse(socket, proxyRes)

        // Set up bidirectional piping
        this.setupBidirectionalPipe(socket, proxySocket, head, proxyHead)
      })

      proxyReq.on('error', (error) => {
        clearTimeout(timeoutId)
        this.handleUpgradeError(error, socket)
      })

      proxyReq.on('timeout', () => {
        clearTimeout(timeoutId)
        const timeoutError = new Error('WebSocket upgrade timeout')
        this.handleUpgradeError(timeoutError, socket)
        proxyReq.destroy()
      })

      proxyReq.end()
    } catch (error) {
      this.handleUpgradeError(error, socket)
    }
  }
}
