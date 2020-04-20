import { Injector } from '@furystack/inject/dist/injector'
import { StoreManager } from './store-manager'
import { globalDisposables } from './global-disposables'

declare module '@furystack/inject/dist/injector' {
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
