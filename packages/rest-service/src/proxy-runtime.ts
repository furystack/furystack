import { PathHelper } from '@furystack/utils'
import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http'
import type { Duplex } from 'stream'
import { HttpProxyHandler } from './http-proxy-handler.js'
import type { ServerApi } from './http-server-pool.js'
import { PathProcessor } from './path-processor.js'
import type { ServerTelemetry } from './server-telemetry.js'
import { WebSocketProxyHandler } from './websocket-proxy-handler.js'

/**
 * Options accepted by {@link buildProxyServerApi} and {@link useProxy}.
 * Mirrors the original `ProxyOptions` shape from the deleted
 * `ProxyManager`; see that history for field-by-field documentation.
 */
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

const createRequestHandler = (options: ProxyOptions, telemetry: ServerTelemetry) => {
  const handler = new HttpProxyHandler({
    sourceBaseUrl: options.sourceBaseUrl,
    targetBaseUrl: options.targetBaseUrl,
    pathRewrite: options.pathRewrite,
    headers: options.headers,
    cookies: options.cookies,
    responseCookies: options.responseCookies,
    timeout: options.timeout,
    onError: (error) => telemetry.emit('onProxyFailed', error),
  })
  return async ({ req, res }: { req: IncomingMessage; res: ServerResponse }) => handler.handle(req, res)
}

const createUpgradeHandler = (options: ProxyOptions, telemetry: ServerTelemetry) => {
  const handler = new WebSocketProxyHandler({
    sourceBaseUrl: options.sourceBaseUrl,
    targetBaseUrl: options.targetBaseUrl,
    pathRewrite: options.pathRewrite,
    headers: options.headers,
    timeout: options.timeout,
    onError: (error) => telemetry.emit('onWebSocketProxyFailed', error),
  })
  return async ({ req, socket, head }: { req: IncomingMessage; socket: Duplex; head: Buffer }) =>
    handler.handle(req, socket, head)
}

const shouldExecProxy =
  (sourceBaseUrl: string) =>
  ({ req }: { req: Pick<IncomingMessage, 'url' | 'method'> }): boolean =>
    req.url ? PathHelper.matchesBaseUrl(req.url, sourceBaseUrl) : false

/**
 * Validates the proxy configuration and returns a {@link ServerApi} that
 * forwards HTTP (and optionally WebSocket) traffic from
 * `options.sourceBaseUrl` to `options.targetBaseUrl`.
 */
export const buildProxyServerApi = (options: ProxyOptions, telemetry: ServerTelemetry): ServerApi => {
  const pathProcessor = new PathProcessor()
  const targetUrl = pathProcessor.validateUrl(options.targetBaseUrl, 'targetBaseUrl')
  pathProcessor.validateHttpProtocol(targetUrl)

  return {
    shouldExec: shouldExecProxy(options.sourceBaseUrl),
    onRequest: createRequestHandler(options, telemetry),
    ...(options.enableWebsockets ? { onUpgrade: createUpgradeHandler(options, telemetry) } : {}),
  }
}
