import { User } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { HttpAuthenticationSettings } from './http-authentication-settings'
import { RestApi } from '@furystack/rest'
import { ApiManager, ImplementApiOptions } from './api-manager'
import { DefaultSession } from './models/default-session'

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
) => {
  const constructedSettings = new HttpAuthenticationSettings(injector)
  Object.assign(constructedSettings, settings)

  return injector.setExplicitInstance(constructedSettings, HttpAuthenticationSettings)
}
