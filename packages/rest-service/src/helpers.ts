import type { User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { RestApi } from '@furystack/rest'
import type { ImplementApiOptions } from './api-manager.js'
import { ApiManager } from './api-manager.js'
import { HttpAuthenticationSettings } from './http-authentication-settings.js'
import type { DefaultSession } from './models/default-session.js'
import type { ProxyOptions } from './proxy-manager.js'
import { ProxyManager } from './proxy-manager.js'
import type { StaticServerOptions } from './static-server-manager.js'
import { StaticServerManager } from './static-server-manager.js'

/**
 * Sets up the @furystack/rest-service with the provided settings
 * @param api The API implementation details
 * @returns a promise that resolves when the API is added to the server
 */
export const useRestService = async <T extends RestApi>(api: ImplementApiOptions<T>) =>
  await api.injector.getInstance(ApiManager).addApi({ ...api })

/**
 * Sets up the HTTP Authentication
 * @param injector  The Injector instance
 * @param settings Settings for HTTP Authentication
 * @returns void
 */
export const useHttpAuthentication = <TUser extends User, TSession extends DefaultSession>(
  injector: Injector,
  settings?: Partial<HttpAuthenticationSettings<TUser, TSession>>,
) => injector.setExplicitInstance(Object.assign(new HttpAuthenticationSettings(), settings), HttpAuthenticationSettings)

/**
 * Sets up a static file server
 * @param options The settings for the static file server
 * @param options.injector The Injector instance
 * @param options.settings Settings for the static file server
 * @returns a promise that resolves when the server is ready
 */
export const useStaticFiles = (options: { injector: Injector } & StaticServerOptions) => {
  const { injector, ...settings } = options
  return injector.getInstance(StaticServerManager).addStaticSite(settings)
}

/**
 * Sets up a proxy server that forwards HTTP requests from a source URL to a target URL.
 *
 * The proxy acts as an intermediary, forwarding requests and responses while allowing
 * transformation of headers, cookies, and paths. It returns 502 Bad Gateway on errors
 * and emits 'onProxyFailed' events for monitoring.
 *
 * WebSocket connections can also be proxied by setting `enableWebsockets: true`, allowing
 * bidirectional real-time communication through the proxy.
 *
 * @param options The settings for the proxy server
 * @param options.injector The Injector instance
 * @param options.sourceBaseUrl The base URL path to match for proxying (e.g., '/api', '/old').
 *                               Can be specified with or without a trailing slash.
 * @param options.targetBaseUrl The target server URL (must be a valid HTTP/HTTPS URL)
 * @param options.pathRewrite Optional function to rewrite the path before forwarding.
 *                            Receives the path after sourceBaseUrl, including leading slash and query string.
 *                            Example: for 'GET /api/users?active=true' with sourceBaseUrl='/api',
 *                            pathRewrite receives '/users?active=true'
 * @param options.sourceHostName The hostname for the source server (optional, defaults to all interfaces)
 * @param options.sourcePort The port for the source server
 * @param options.headers Optional function to transform request headers.
 *                        **Note**: Receives headers AFTER filtering hop-by-hop headers
 *                        (Connection, Keep-Alive, Transfer-Encoding, Upgrade, etc.) for security
 *                        and protocol compliance. The proxy automatically adds X-Forwarded-* headers.
 *                        This transformation applies to both HTTP and WebSocket requests.
 * @param options.cookies Optional function to transform request cookies (array of cookie strings)
 * @param options.responseCookies Optional function to transform response Set-Cookie headers
 * @param options.timeout Optional timeout in milliseconds for proxy requests (default: 30000).
 *                        If exceeded, the request is aborted and 502 is returned.
 *                        Applies to both HTTP and WebSocket upgrade requests.
 * @param options.enableWebsockets Optional flag to enable WebSocket proxying (default: false).
 *                                 When enabled, WebSocket upgrade requests will be forwarded to the target.
 * @returns a promise that resolves when the proxy is set up
 * @example
 * ```ts
 * // Basic HTTP proxy with timeout
 * await useProxy({
 *   injector,
 *   sourceBaseUrl: '/api',
 *   targetBaseUrl: 'https://api.example.com',
 *   sourcePort: 3000,
 *   timeout: 5000,
 * })
 *
 * // Proxy with WebSocket support
 * await useProxy({
 *   injector,
 *   sourceBaseUrl: '/ws',
 *   targetBaseUrl: 'https://ws.example.com',
 *   sourcePort: 3000,
 *   enableWebsockets: true,
 * })
 *
 * // Proxy with error monitoring (HTTP and WebSocket)
 * const proxyManager = injector.getInstance(ProxyManager)
 * proxyManager.subscribe('onProxyFailed', ({ from, to, error }) => {
 *   console.error(`HTTP Proxy failed: ${from} -> ${to}`, error)
 * })
 * proxyManager.subscribe('onWebSocketProxyFailed', ({ from, to, error }) => {
 *   console.error(`WebSocket Proxy failed: ${from} -> ${to}`, error)
 * })
 * ```
 */
export const useProxy = (options: { injector: Injector } & ProxyOptions) => {
  const { injector, ...settings } = options
  return injector.getInstance(ProxyManager).addProxy(settings)
}
