import { Constructable, Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { Disposable } from '@sensenet/client-utils'
import { DefaultFilter, IPhysicalStore } from './Models/IPhysicalStore'

/**
 * Manager class for store instances
 */
@Injectable({ lifetime: 'singleton' })
export class StoreManager implements Disposable {
  /**
   * Disposes the StoreManager and all store instances
   */
  public async dispose() {
    for (const store of this.stores.values()) {
      await store.dispose()
    }
  }
  private stores: Map<Constructable<any>, IPhysicalStore<any>> = new Map()

  /**
   * Returns a store model for a constructable object.
   * Throws error if no store is registered
   * @param model The Constructable object
   */
  public getStoreFor<T>(model: Constructable<T>) {
    const instance = this.stores.get(model)
    if (!instance) {
      const message = `Store not found for '${model.name}'`
      this.logger.warning({
        message,
      })

      throw Error(message)
    }
    return instance as IPhysicalStore<T>
  }

  /**
   * Adds a store instance to the StoreManager class
   * @param store The store to add
   * @returns {this} the StoreManager instance
   */
  public addStore<T>(store: IPhysicalStore<T, DefaultFilter<T>>) {
    this.stores.set(store.model, store)
    return this
  }

  private logger: ScopedLogger

  constructor(public injector: Injector) {
    this.logger = injector.logger.withScope('@furystack/core/' + this.constructor.name)
  }
}
