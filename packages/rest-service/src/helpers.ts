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
 * Sets up a proxy server
 * @param options The settings for the proxy server
 * @param options.injector The Injector instance
 * @param options.sourceBaseUrl The base URL to match for proxying
 * @param options.targetBaseUrl The target base URL for proxying
 * @param options.pathRewrite Optional function to rewrite the source path to target path
 * @param options.sourceHostName The hostname for the source server (optional)
 * @param options.sourcePort The port for the source server
 * @param options.headers Optional function to transform request headers
 * @param options.cookies Optional function to transform request cookies
 * @param options.responseCookies Optional function to transform response Set-Cookie headers
 * @returns a promise that resolves when the proxy is set up
 */
export const useProxy = (options: { injector: Injector } & ProxyOptions) => {
  const { injector, ...settings } = options
  return injector.getInstance(ProxyManager).addProxy(settings)
}
