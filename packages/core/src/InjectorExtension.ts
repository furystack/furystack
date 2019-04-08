import { Injector } from '@furystack/inject/dist/Injector'
import { StoreManager } from './StoreManager'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/inject/dist/Injector' {
  /**
   * Defines an extended Injector instance
   */
  interface Injector {
    setupStores: (builder: (storeManager: StoreManager) => void) => Injector
  }
}

// tslint:disable-next-line: no-unnecessary-type-annotation
Injector.prototype.setupStores = function(builder) {
  builder(this.getInstance(StoreManager))
  return this
}
