import { User } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { HttpAuthenticationSettings } from './http-authentication-settings'
import { RestApi } from '@furystack/rest'
import { ApiManager, ImplementApiOptions } from './api-manager'
import { DefaultSession } from './models/default-session'
import { StaticServerManager, StaticServerOptions } from './static-server-manager'

/**
 * Sets up the @furystack/rest-service with the provided settings
 *
 * @param api The API implementation details
 */
export const useRestService = async <T extends RestApi>(api: ImplementApiOptions<T>) => {
  await api.injector.getInstance(ApiManager).addApi({ ...api })
  return this
}

/**
 * Sets up the HTTP Authentication
 *
 * @param injector  The Injector instance
 * @param settings Settings for HTTP Authentication
 * @returns void
 */
export const useHttpAuthentication = <TUser extends User, TSession extends DefaultSession>(
  injector: Injector,
  settings?: Partial<HttpAuthenticationSettings<TUser, TSession>>,
) => injector.setExplicitInstance({ ...new HttpAuthenticationSettings(), ...settings }, HttpAuthenticationSettings)

/**
 * Sets up a static file server
 *
 * @param options The settings for the static file server
 * @param options.injector The Injector instance
 * @param options.settings Settings for the static file server
 * @returns a promise that resolves when the server is ready
 */
export const useStaticFiles = (options: { injector: Injector } & StaticServerOptions) => {
  const { injector, ...settings } = options
  return injector.getInstance(StaticServerManager).addStaticSite(settings)
}
