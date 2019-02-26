import { Constructable, Injectable, Injector } from '@furystack/inject'
import { IPhysicalStore } from './Models/IPhysicalStore'

/**
 * User class
 */
export class User {
  public username: string = 'alma'
}

/**
 * Manager class for store instances
 */
// tslint:disable-next-line: max-classes-per-file
@Injectable()
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
