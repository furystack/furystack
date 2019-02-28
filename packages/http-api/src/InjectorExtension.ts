import { IUser } from '@furystack/core'
import { ServerManager } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { Injector } from '@furystack/inject/dist/Injector'
import { createServer as createHttpServer, IncomingMessage } from 'http'
import { ServerOptions } from 'https'
import { createServer as createHttpsServer } from 'https'
import { parse } from 'url'
import { GetCurrentUser, HttpAuthenticationSettings, IRequestAction, LoginAction, LogoutAction } from '.'
import { HttpApi } from './HttpApi'
import { HttpApiSettings } from './HttpApiSettings'

/**
 * Injector instance extended with HTTP Api specified stuff
 */
export interface HttpExtendedInjector extends Injector {
  useHttpAuthentication: <TUser extends IUser = IUser>(
    settings: Partial<HttpAuthenticationSettings<TUser>>,
  ) => HttpExtendedInjector
  addHttpRouting: (
    route: (incomingMessage: IncomingMessage) => Constructable<IRequestAction> | undefined,
  ) => HttpExtendedInjector

  useDefaultLoginRoutes: () => HttpExtendedInjector

  listenHttp: (options?: { port?: number; hostName?: string }) => HttpExtendedInjector
  listenHttps: (options: { port?: number; hostName?: string; credentials: ServerOptions }) => HttpExtendedInjector
}

declare module '@furystack/inject/dist/Injector' {
  /**
   * Extended Injector with Http API related methods
   */
  export interface Injector {
    useHttpApi: (settings?: Partial<HttpApiSettings>) => HttpExtendedInjector
  }
}

Injector.prototype.useHttpApi = function(settings) {
  this.logger.verbose({
    scope: '@furystack/http-api/useHttpApi',
    message: 'Setting up HTTP API...',
    data: settings,
  })

  const xi = this as HttpExtendedInjector
  xi.setExplicitInstance({ ...new HttpApiSettings(), ...settings }, HttpApiSettings)
  xi.useHttpAuthentication = s => {
    xi.setExplicitInstance({ ...new HttpAuthenticationSettings(), ...s }, HttpAuthenticationSettings)
    return xi
  }

  xi.listenHttp = options => {
    this.logger.verbose({
      scope: '@furystack/http-api/useHttpApi',
      message: `Starting listener at http://${(options && options.hostName) || 'localhost'}:${(options &&
        options.port) ||
        80}`,
    })

    const api = xi.getInstance(HttpApi)
    const s = createHttpServer(api.mainRequestListener.bind(api))
    s.listen(options && options.port, options && options.hostName)
    xi.getInstance(ServerManager).set(s)
    return xi
  }

  xi.listenHttps = options => {
    this.logger.verbose({
      scope: '@furystack/http-api/useHttpApi',
      message: `Starting listener at https://${(options && options.hostName) || 'localhost'}:${(options &&
        options.port) ||
        80}`,
    })
    const api = xi.getInstance(HttpApi)
    const s = createHttpsServer(options.credentials, api.mainRequestListener.bind(api))
    s.listen(options.port, options.hostName)
    xi.getInstance(ServerManager).set(s)
    return xi
  }

  xi.addHttpRouting = route => {
    xi.getInstance(HttpApiSettings).actions.push(route)
    return xi
  }

  xi.useDefaultLoginRoutes = () =>
    xi.addHttpRouting(msg => {
      const urlPathName = parse(msg.url || '', true).pathname
      switch (urlPathName) {
        case '/currentUser':
          return GetCurrentUser
        case '/login':
          return LoginAction
        case '/logout':
          return LogoutAction
      }
      return undefined
    })

  xi.getInstance(HttpApi)
  return xi
}
