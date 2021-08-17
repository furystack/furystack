import { Injector } from '@furystack/inject/dist/esm/injector'
import { StoreManager } from './store-manager'
import { globalDisposables } from './global-disposables'
import { IdentityContext } from './identity-context'
import { User } from './models/user'

declare module '@furystack/inject/dist/esm/injector' {
  /**
   * Defines an extended Injector instance
   */
  export interface Injector {
    /**
     * Registers a store instance to the StoreManager.
     *
     * Usage example:
     * ````ts
     * myInjector.setupStores(sm => sm.addStore(new InMemoryStore({ model: TestEntry, primaryKey: "_id" })))
     * ````
     * You can get the store later from the StoreManager:
     * ````ts
     * const myStore: IPhysicalStore<TestEntry> = myInjector.getInstance(StoreManager).getStoreFor(TestEntry)
     * ````
     */
    setupStores: (builder: (storeManager: StoreManager) => void) => this

    /**
     * The disposable will be disposed on process exit
     */
    disposeOnProcessExit: () => this

    /**
     *  returns the current authentication status from the identity context
     */
    isAuthenticated: () => Promise<boolean>

    /**
     *  returns the current authorization status from the identity context
     */
    isAuthorized: (...roles: string[]) => Promise<boolean>

    /**
     *
     */
    getCurrentUser: <TUser extends User>() => Promise<TUser>
  }
}

Injector.prototype.setupStores = function (builder) {
  builder(this.getInstance(StoreManager))
  return this
}

Injector.prototype.disposeOnProcessExit = function () {
  globalDisposables.add(this)
  return this
}

Injector.prototype.isAuthenticated = async function () {
  return this.getInstance(IdentityContext).isAuthenticated()
}

Injector.prototype.isAuthorized = async function (...roles) {
  return this.getInstance(IdentityContext).isAuthorized(...roles)
}

Injector.prototype.getCurrentUser = async function <TUser extends User>() {
  return this.getInstance(IdentityContext).getCurrentUser<TUser>()
}
