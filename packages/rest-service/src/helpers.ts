import type { User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { HttpAuthenticationSettings } from './http-authentication-settings.js'
import type { RestApi } from '@furystack/rest'
import type { ImplementApiOptions } from './api-manager.js'
import { ApiManager } from './api-manager.js'
import type { DefaultSession } from './models/default-session.js'
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
