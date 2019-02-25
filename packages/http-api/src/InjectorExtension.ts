import { IUser } from '@furystack/core'
import { Injector } from '@furystack/inject/dist/Injector'
import { HttpAuthenticationSettings } from '.'
import { HttpApi } from './HttpApi'
import { HttpApiSettings } from './HttpApiSettings'

/**
 * Injector instance extended with HTTP Api specified stuff
 */
export interface HttpExtendedInjector extends Injector {
  useHttpAuthentication: <TUser extends IUser = IUser>(settings: Partial<HttpAuthenticationSettings<TUser>>) => void
}

declare module '@furystack/inject/dist/Injector' {
  export interface Injector {
    useHttpApi: (settings: Partial<HttpApiSettings>) => HttpExtendedInjector
  }
}

Injector.prototype.useHttpApi = function(settings) {
  const xi = this as HttpExtendedInjector
  xi.setExplicitInstance({ ...new HttpApiSettings(), ...settings }, HttpApiSettings)
  xi.useHttpAuthentication = s => {
    xi.setExplicitInstance({ ...new HttpAuthenticationSettings(), ...s }, HttpAuthenticationSettings)
  }
  xi.getInstance(HttpApi)
  return xi
}
