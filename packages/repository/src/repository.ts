import { StoreManager } from '@furystack/core'
import { Constructable, Injectable, Injected } from '@furystack/inject'
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

  private dataSets: Map<any, DataSet<any, any>> = new Map()

  public getDataSetFor<T, TPrimaryKey extends keyof T>(model: Constructable<T>, primaryKey: TPrimaryKey) {
    const instance = this.dataSets.get(model)
    if (!instance) {
      throw Error(`No DataSet found for '${model}'`)
    }
    if (instance.primaryKey !== primaryKey) {
      throw Error('Primary key mismatch')
    }
    return instance as DataSet<T, TPrimaryKey>
  }
  public createDataSet<T, TPrimaryKey extends keyof T>(
    model: Constructable<T>,
    primaryKey: TPrimaryKey,
    settings?: Partial<DataSetSettings<T, TPrimaryKey>>,
  ) {
    const physicalStore = (settings && settings.physicalStore) || this.storeManager.getStoreFor(model, primaryKey)
    const instance = new DataSet({
      ...settings,
      physicalStore,
    })
    this.dataSets.set(model, instance)
    return this
  }

  @Injected(StoreManager)
  private readonly storeManager!: StoreManager
}
