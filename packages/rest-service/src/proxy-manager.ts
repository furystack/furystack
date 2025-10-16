import { Injectable, Injected } from '@furystack/inject'
import { EventHub, PathHelper } from '@furystack/utils'
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import type { Duplex } from 'stream'
import { HttpProxyHandler } from './http-proxy-handler.js'
import { PathProcessor } from './path-processor.js'
import { ServerManager } from './server-manager.js'
import { WebSocketProxyHandler } from './websocket-proxy-handler.js'

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

/**
 * Manages HTTP and WebSocket proxy configurations and routing
 */
@Injectable({ lifetime: 'singleton' })
export class ProxyManager extends EventHub<{
  onProxyFailed: { from: string; to: string; error: unknown }
  onWebSocketProxyFailed: { from: string; to: string; error: unknown }
}> {
  @Injected(ServerManager)
  declare private readonly serverManager: ServerManager

  private readonly pathProcessor = new PathProcessor()

  /**
   * Creates a function that determines if a request should be handled by this proxy
   */
  public shouldExec =
    (sourceBaseUrl: string) =>
    ({ req }: { req: Pick<IncomingMessage, 'url' | 'method'> }) =>
      req.url ? PathHelper.matchesBaseUrl(req.url, sourceBaseUrl) : false

  /**
   * Creates an HTTP request handler for the proxy
   */
  private createRequestHandler(options: ProxyOptions) {
    const handler = new HttpProxyHandler({
      sourceBaseUrl: options.sourceBaseUrl,
      targetBaseUrl: options.targetBaseUrl,
      pathRewrite: options.pathRewrite,
      headers: options.headers,
      cookies: options.cookies,
      responseCookies: options.responseCookies,
      timeout: options.timeout,
      onError: (error) => this.emit('onProxyFailed', error),
    })

    return async ({ req, res }: { req: IncomingMessage; res: ServerResponse }) => {
      await handler.handle(req, res)
    }
  }

  /**
   * Creates a WebSocket upgrade handler for the proxy
   */
  private createUpgradeHandler(options: ProxyOptions) {
    const handler = new WebSocketProxyHandler({
      sourceBaseUrl: options.sourceBaseUrl,
      targetBaseUrl: options.targetBaseUrl,
      pathRewrite: options.pathRewrite,
      headers: options.headers,
      timeout: options.timeout,
      onError: (error) => this.emit('onWebSocketProxyFailed', error),
    })

    return async ({ req, socket, head }: { req: IncomingMessage; socket: Duplex; head: Buffer }) => {
      await handler.handle(req, socket, head)
    }
  }

  /**
   * Adds a new proxy configuration
   * @throws Error if targetBaseUrl is invalid or uses non-HTTP/HTTPS protocol
   */
  public async addProxy(options: ProxyOptions): Promise<void> {
    // Validate targetBaseUrl format
    const url = this.pathProcessor.validateUrl(options.targetBaseUrl, 'targetBaseUrl')
    this.pathProcessor.validateHttpProtocol(url)

    const server = await this.serverManager.getOrCreate({ hostName: options.sourceHostName, port: options.sourcePort })

    const api = {
      shouldExec: this.shouldExec(options.sourceBaseUrl),
      onRequest: this.createRequestHandler(options),
      ...(options.enableWebsockets ? { onUpgrade: this.createUpgradeHandler(options) } : {}),
    }

    server.apis.push(api)
  }
}
