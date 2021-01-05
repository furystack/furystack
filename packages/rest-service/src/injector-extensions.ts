import { User } from '@furystack/core'
import { Injector } from '@furystack/inject/dist/injector'
import { HttpAuthenticationSettings } from './http-authentication-settings'
import { RestApi } from '@furystack/rest'
import { ApiManager, ImplementApiOptions } from './api-manager'

declare module '@furystack/inject/dist/injector' {
  /**
   * Extended Injector with Http API related methods
   */
  export interface Injector {
    /**
     * Sets up the @furystack/rest-service with the provided settings
     */
    useRestService: <T extends RestApi>(api: Omit<ImplementApiOptions<T>, 'injector'>) => Promise<this>

    /**
     * Sets up the HTTP Authentication
     */
    useHttpAuthentication: <TUser extends User>(settings?: Partial<HttpAuthenticationSettings<TUser>>) => this
  }
}

Injector.prototype.useRestService = async function (api) {
  await this.getInstance(ApiManager).addApi({ ...api, injector: this })
  return this
}

Injector.prototype.useHttpAuthentication = function (s) {
  this.setExplicitInstance({ ...new HttpAuthenticationSettings(), ...s }, HttpAuthenticationSettings)
  return this
}
