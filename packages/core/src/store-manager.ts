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
  private stores: Map<Constructable<unknown>, PhysicalStore<any, any>> = new Map()

  /**
   * Returns a store model for a constructable object.
   * Throws error if no store is registered
   *
   * @param model The Constructable object
   * @param primaryKey The Primary Key field
   * @throws if the Store is not registered
   * @returns a Store object
   */
  public getStoreFor<
    T,
    TPrimaryKey extends keyof T,
    TType extends PhysicalStore<T, TPrimaryKey> = PhysicalStore<T, TPrimaryKey>
  >(model: Constructable<T>, primaryKey: TPrimaryKey) {
    const instance = this.stores.get(model)
    if (!instance) {
      throw Error(`Store not found for '${model.name}'`)
    }
    if (primaryKey !== instance.primaryKey) {
      throw Error('Primary keys not match')
    }
    return instance as TType
  }

  /**
   * Adds a store instance to the StoreManager class
   *
   * @param store The store to add
   * @returns the StoreManager instance for chaining
   */
  public addStore<T, TPrimaryKey extends keyof T>(store: PhysicalStore<T, TPrimaryKey>) {
    this.stores.set(store.model, store as PhysicalStore<any, any>)
    return this
  }

  constructor(public injector: Injector) {}
}
