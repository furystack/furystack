import { IUser } from '@furystack/core'
import { Injector } from '@furystack/inject/dist/Injector'
import { ServerOptions } from 'https'
import { HttpAuthenticationSettings } from '.'
import { HttpApi } from './HttpApi'
import { HttpApiSettings } from './HttpApiSettings'

import { createServer as createHttpServer } from 'http'
import { createServer as createHttpsServer } from 'https'

/**
 * Injector instance extended with HTTP Api specified stuff
 */
export interface HttpExtendedInjector extends Injector {
  useHttpAuthentication: <TUser extends IUser = IUser>(
    settings: Partial<HttpAuthenticationSettings<TUser>>,
  ) => HttpExtendedInjector
  listenHttp: (options?: { port?: number; hostName?: string }) => HttpExtendedInjector
  listenHttps: (options: { port?: number; hostName?: string; credentials: ServerOptions }) => HttpExtendedInjector
}

declare module '@furystack/inject/dist/Injector' {
  /**
   * Extended Injector with Http API related methods
   */
  export interface Injector {
    useHttpApi: (settings: Partial<HttpApiSettings>) => HttpExtendedInjector
  }
}

Injector.prototype.useHttpApi = function(settings) {
  const xi = this as HttpExtendedInjector
  xi.setExplicitInstance({ ...new HttpApiSettings(), ...settings }, HttpApiSettings)
  xi.useHttpAuthentication = s => {
    xi.setExplicitInstance({ ...new HttpAuthenticationSettings(), ...s }, HttpAuthenticationSettings)
    return xi
  }

  xi.listenHttp = options => {
    const api = xi.getInstance(HttpApi)
    const s = createHttpServer(api.mainRequestListener.bind(api))
    s.listen(options && options.port, options && options.hostName)
    return xi
  }

  xi.listenHttps = options => {
    const api = xi.getInstance(HttpApi)
    const s = createHttpsServer(options.credentials, api.mainRequestListener.bind(api))
    s.listen(options.port, options.hostName)
    return xi
  }

  xi.getInstance(HttpApi)
  return xi
}
