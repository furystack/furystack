import { Constructable, Injectable, Injector } from '@furystack/inject'
import { Disposable } from '@furystack/utils'
import { AggregatedError } from './errors'
import { PhysicalStore } from './models/physical-store'

/**
 * Manager class for store instances
 */
@Injectable({ lifetime: 'singleton' })
export class StoreManager implements Disposable {
  /**
   * Disposes the StoreManager and all store instances
   */
  public async dispose() {
    const result = await Promise.allSettled([...this.stores.entries()].map(async ([_model, store]) => store.dispose()))
    const fails = result.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
    if (fails && fails.length) {
      const error = new AggregatedError(`There was an error during disposing ${fails.length} stores.`, fails)
      throw error
    }
  }
  private stores: Map<Constructable<any>, PhysicalStore<any>> = new Map()

  /**
   * Returns a store model for a constructable object.
   * Throws error if no store is registered
   *
   * @param model The Constructable object
   * @throws if the Store is not registered
   * @returns a Store object
   */
  public getStoreFor<T, TType extends PhysicalStore<T> = PhysicalStore<T>>(model: Constructable<T>) {
    const instance = this.stores.get(model)
    if (!instance) {
      throw Error(`Store not found for '${model.name}'`)
    }
    return instance as TType
  }

  /**
   * Adds a store instance to the StoreManager class
   *
   * @param store The store to add
   * @returns the StoreManager instance for chaining
   */
  public addStore<T>(store: PhysicalStore<T>) {
    this.stores.set(store.model, store)
    return this
  }

  constructor(public injector: Injector) {}
}
