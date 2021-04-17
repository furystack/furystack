import { PhysicalStore, StoreManager } from '@furystack/core'
import { Constructable, Injectable } from '@furystack/inject'
import { Disposable } from '@furystack/utils'
import { DataSetSettings } from './data-set-setting'
import { DataSet } from './data-set'

/**
 * Collection of authorized physical stores
 */
@Injectable({ lifetime: 'singleton' })
export class Repository implements Disposable {
  public dispose() {
    this.dataSets.forEach((ds) => ds.dispose())
    this.dataSets.clear()
  }

  private dataSets: Map<any, DataSet<any>> = new Map()

  public getDataSetFor<T>(model: Constructable<T>) {
    const instance = this.dataSets.get(model)
    if (!instance) {
      throw Error(`No DataSet found for '${model}'`)
    }
    return instance as DataSet<T>
  }
  public createDataSet<T, TPrimaryKey extends keyof T>(
    model: Constructable<T>,
    primaryKey: TPrimaryKey,
    settings?: Partial<DataSetSettings<T, keyof T>>,
  ) {
    const physicalStore =
      (settings && settings.physicalStore) ||
      (this.storeManager.getStoreFor(model, primaryKey) as PhysicalStore<T, TPrimaryKey>)
    const instance = new DataSet({
      ...settings,
      physicalStore,
    })
    this.dataSets.set(model, instance)
    return this
  }

  constructor(private readonly storeManager: StoreManager) {}
}
