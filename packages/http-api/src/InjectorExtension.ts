import { ServerManager, User, InMemoryStore } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { Injector } from '@furystack/inject/dist/Injector'
import { createServer as createHttpServer, IncomingMessage } from 'http'
import { ServerOptions } from 'https'
import { createServer as createHttpsServer } from 'https'
import { HttpAuthenticationSettings, IRequestAction } from '.'
import { defaultLoginRoutes } from './default-login-routes'
import { HttpApi } from './HttpApi'
import { HttpApiSettings } from './HttpApiSettings'
import { DefaultSession } from './Models/DefaultSession'

/**
 * Injector instance extended with HTTP Api specified stuff
 */
export interface HttpExtendedInjector extends Injector {
  useHttpAuthentication: <TUser extends User>(
    settings?: Partial<HttpAuthenticationSettings<TUser>>,
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
  const logger = this.logger.withScope('@furystack/http-api/useHttpApi')
  logger.verbose({
    message: 'Setting up HTTP API...',
    data: settings,
  })

  const xi = this as HttpExtendedInjector

  // Setup default in memory stores for Users and Sessions
  xi.setupStores(sm =>
    sm
      .addStore(new InMemoryStore({ model: User, primaryKey: 'username' }))
      .addStore(new InMemoryStore({ model: DefaultSession, primaryKey: 'sessionId' })),
  )

  xi.setExplicitInstance({ ...new HttpApiSettings(), ...settings }, HttpApiSettings)
  xi.useHttpAuthentication = s => {
    xi.setExplicitInstance({ ...new HttpAuthenticationSettings(), ...s }, HttpAuthenticationSettings)
    return xi
  }

  xi.listenHttp = options => {
    logger.verbose({
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
    logger.verbose({
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

  xi.useDefaultLoginRoutes = () => xi.addHttpRouting(defaultLoginRoutes)

  xi.getInstance(HttpApi)
  return xi
}
