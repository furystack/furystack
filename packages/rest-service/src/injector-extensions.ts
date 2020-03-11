import { IncomingMessage, ServerResponse } from 'http'
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
     * returns the current Request (IncomingMessage) instance
     */
    getRequest: () => IncomingMessage

    /**
     * Returns the current Response(ServerResponse) instance
     */
    getResponse: () => ServerResponse

    /**
     * Sets up the HTTP Authentication
     */
    useHttpAuthentication: <TUser extends User>(settings?: Partial<HttpAuthenticationSettings<TUser>>) => Injector
    /**
     * Add a specific routing to the HTTP API
     */
  }
}

Injector.prototype.getRequest = function() {
  return this.getInstance(IncomingMessage)
}

Injector.prototype.getResponse = function() {
  return this.getInstance(ServerResponse)
}

Injector.prototype.useRestService = async function(api) {
  const logger = this.logger.withScope('@furystack/rest-service/useRestService')
  logger.verbose({
    message: 'Setting up Rest Service API...',
    data: api,
  })
  await this.getInstance(ApiManager).addApi({ ...api, injector: this })
  logger.verbose({
    message: `Rest Service API is listening at ${api.port}`,
    data: api,
  })
  return this
}

Injector.prototype.useHttpAuthentication = function(s) {
  this.setExplicitInstance({ ...new HttpAuthenticationSettings(), ...s }, HttpAuthenticationSettings)
  return this
}
