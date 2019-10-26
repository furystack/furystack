import { IncomingMessage, ServerResponse, createServer as createHttpServer } from 'http'
import { ServerOptions, createServer as createHttpsServer } from 'https'
import { Injector } from '@furystack/inject/dist/Injector'
import { ServerManager, User } from '@furystack/core'
import { defaultLoginRoutes } from './default-login-routes'
import { HttpApi } from './HttpApi'
import { HttpApiSettings } from './HttpApiSettings'
import { RouteModel } from './Models'
import { HttpAuthenticationSettings } from '.'

declare module '@furystack/inject/dist/Injector' {
  /**
   * Extended Injector with Http API related methods
   */
  export interface Injector {
    /**
     * Sets up the @furystack/http-api with the provided settings
     */
    useHttpApi: (settings?: Partial<HttpApiSettings>) => this
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
    addHttpRouting: (route: RouteModel) => Injector

    /**
     * Adds the default login / logout routes
     */
    useDefaultLoginRoutes: () => Injector

    /**
     * Starts the HTTP Listener
     */
    listenHttp: (options?: { port?: number; hostName?: string }) => Injector
    /**
     * Starts the HTTPS Listener
     */
    listenHttps: (options: { port?: number; hostName?: string; credentials: ServerOptions }) => Injector
  }
}

Injector.prototype.getRequest = function() {
  return this.getInstance(IncomingMessage)
}

Injector.prototype.getResponse = function() {
  return this.getInstance(ServerResponse)
}

Injector.prototype.useHttpApi = function(settings) {
  const logger = this.logger.withScope('@furystack/http-api/useHttpApi')
  logger.verbose({
    message: 'Setting up HTTP API...',
    data: settings,
  })

  const oldSettings = this.getInstance(HttpApiSettings)

  this.setExplicitInstance(
    {
      ...oldSettings,
      ...settings,
      actions: [...oldSettings.actions, ...(settings && settings.actions ? settings.actions : [])],
    },
    HttpApiSettings,
  )
  this.getInstance(HttpApi)
  return this
}

Injector.prototype.useHttpAuthentication = function(s) {
  this.setExplicitInstance({ ...new HttpAuthenticationSettings(), ...s }, HttpAuthenticationSettings)
  return this
}

Injector.prototype.listenHttp = function(options) {
  this.logger.withScope('@furystack/http-api/listenHttp').verbose({
    message: `Starting listener at http://${(options && options.hostName) || 'localhost'}:${(options && options.port) ||
      80}`,
  })

  const api = this.getInstance(HttpApi)
  const s = createHttpServer(api.mainRequestListener.bind(api))
  s.listen(options && options.port, options && options.hostName)
  this.getInstance(ServerManager).set(s)
  return this
}

Injector.prototype.listenHttps = function(options) {
  this.logger.withScope('@furystack/http-api/listenHttps').verbose({
    message: `Starting listener at https://${(options && options.hostName) || 'localhost'}:${(options &&
      options.port) ||
      80}`,
  })
  const api = this.getInstance(HttpApi)
  const s = createHttpsServer(options.credentials, api.mainRequestListener.bind(api))
  s.listen(options.port, options.hostName)
  this.getInstance(ServerManager).set(s)
  return this
}

Injector.prototype.addHttpRouting = function(route) {
  this.getInstance(HttpApiSettings).actions.push(route)
  return this
}

Injector.prototype.useDefaultLoginRoutes = function() {
  this.addHttpRouting(defaultLoginRoutes)
  return this
}
