import { DefaultFilter, IPhysicalStore, StoreManager } from '@furystack/core'
import { Constructable, Injectable } from '@furystack/inject'
import { DataSet } from './DataSet'
import { DataSetSettings } from './DataSetSettings'

/**
 * Collection of authorized physical stores
 */
@Injectable({ lifetime: 'singleton' })
export class Repository {
  private dataSets: Map<string | Constructable<any>, DataSet<any, any>> = new Map()

  public getDataSetFor<T, TFilter = DefaultFilter<T>>(model: Constructable<T> | string) {
    const modelName = typeof model !== 'string' ? model.name : model
    const instance = this.dataSets.get(modelName)
    if (!instance) {
      throw Error(`No DataSet found for '${modelName}'`)
    }
    return instance as DataSet<T, TFilter>
  }
  public createDataSet<T, TFilter = DefaultFilter<T>>(
    model: Constructable<T>,
    settings?: Partial<DataSetSettings<T, TFilter>>,
  ) {
    const physicalStore =
      (settings && settings.physicalStore) || (this.storeManager.getStoreFor(model) as IPhysicalStore<T, TFilter>)
    const name = (settings && settings.name) || model.name
    const instance = new DataSet({
      ...settings,
      physicalStore,
      name,
    })
    this.dataSets.set((settings && settings.name) || model, instance)
    return this
  }

  constructor(private readonly storeManager: StoreManager) {}
}
