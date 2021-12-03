import { Injector } from '@furystack/inject'
import { StoreManager } from './store-manager'
import { globalDisposables } from './global-disposables'
import { IdentityContext } from './identity-context'
import { User } from './models/user'

export const setupStores = (injector: Injector, builder: (sm: StoreManager) => void) => {
  builder(injector.getInstance(StoreManager))
  return injector
}

export const disposeOnProcessExit = (injector: Injector) => {
  globalDisposables.add(injector)
  return injector
}

export const isAuthenticated = async (injector: Injector) => {
  return injector.getInstance(IdentityContext).isAuthenticated()
}

export const isAuthorized = async function (injector: Injector, ...roles: string[]) {
  return injector.getInstance(IdentityContext).isAuthorized(...roles)
}

export const getCurrentUser = async <TUser extends User>(injector: Injector) => {
  return injector.getInstance(IdentityContext).getCurrentUser<TUser>()
}
