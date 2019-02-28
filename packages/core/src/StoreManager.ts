import { Constructable, Injectable, Injector } from '@furystack/inject'
import { IPhysicalStore } from './Models/IPhysicalStore'

/**
 * Manager class for store instances
 */
@Injectable({ lifetime: 'singleton' })
export class StoreManager {
  private stores: Map<Constructable<any>, IPhysicalStore<any>> = new Map()

  public getStoreFor<T>(model: Constructable<T>) {
    const instance = this.stores.get(model)
    if (!instance) {
      throw Error(`Store not found for '${model.name}'`)
    }
    return instance as IPhysicalStore<T>
  }

  public addStore<T>(model: Constructable<T>, store: IPhysicalStore<T>) {
    this.stores.set(model, store)
    return this
  }

  /**
   *
   */
  constructor(public injector: Injector) {}
}
