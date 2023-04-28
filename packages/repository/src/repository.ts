import type { WithOptionalId } from '@furystack/core'
import { StoreManager } from '@furystack/core'
import type { Constructable } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { Disposable } from '@furystack/utils'
import type { DataSetSettings } from './data-set-setting.js'
import { DataSet } from './data-set.js'

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

  public getDataSetFor<T, TPrimaryKey extends keyof T, TWritableData = WithOptionalId<T, TPrimaryKey>>(
    model: Constructable<T>,
    primaryKey: TPrimaryKey,
  ) {
    const instance = this.dataSets.get(model)
    if (!instance) {
      throw Error(`No DataSet found for '${model}'`)
    }
    if (instance.primaryKey !== primaryKey) {
      throw Error('Primary key mismatch')
    }
    return instance as unknown as DataSet<T, TPrimaryKey, TWritableData>
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
