import { IPhysicalStore, StoreManager, DefaultFilter } from '@furystack/core'
import { Constructable, Injectable } from '@furystack/inject'
import { DataSet } from './DataSet'
import { DataSetSettings } from './DataSetSettings'

/**
 * Collection of authorized physical stores
 */
@Injectable({ lifetime: 'singleton' })
export class Repository {
  private dataSets: Map<Constructable<any>, DataSet<any, any>> = new Map()

  public getDataSetFor<T, TFilter = DefaultFilter<T>>(model: Constructable<T>) {
    const instance = this.dataSets.get(model)
    if (!instance) {
      throw Error(`No DataSet found for '${model.name}'`)
    }
    return instance as DataSet<T, TFilter>
  }
  public createDataSet<T, TFilter = DefaultFilter<T>>(
    model: Constructable<T>,
    settings?: Partial<DataSetSettings<T, TFilter>>,
  ) {
    const physicalStore =
      (settings && settings.physicalStore) || (this.storeManager.getStoreFor(model) as IPhysicalStore<T, TFilter>)
    const instance = new DataSet({
      ...settings,
      physicalStore,
    })
    this.dataSets.set(model, instance)
    return this
  }

  constructor(private readonly storeManager: StoreManager) {}
}
