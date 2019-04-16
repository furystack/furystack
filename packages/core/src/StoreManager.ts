import { Constructable, Injectable, Injector } from '@furystack/inject'
import { ScopedLogger } from '@furystack/logging'
import { Disposable } from '@sensenet/client-utils'
import { DefaultFilter, IPhysicalStore } from './Models/IPhysicalStore'

/**
 * Manager class for store instances
 */
@Injectable({ lifetime: 'singleton' })
export class StoreManager implements Disposable {
  public async dispose() {
    for (const store of this.stores.values()) {
      await store.dispose()
    }
  }
  private stores: Map<Constructable<any>, IPhysicalStore<any>> = new Map()

  public getStoreFor<T>(model: Constructable<T>) {
    const instance = this.stores.get(model)
    if (!instance) {
      this.logger.warning({
        message: `Store not found for '${model.name}'`,
      })

      throw Error(`Store not found for '${model.name}'`)
    }
    return instance as IPhysicalStore<T>
  }

  public addStore<T>(store: IPhysicalStore<T, DefaultFilter<T>>) {
    this.stores.set(store.model, store)
    return this
  }

  private logger: ScopedLogger

  constructor(public injector: Injector) {
    this.logger = injector.logger.withScope('@furystack/core/' + this.constructor.name)
  }
}
