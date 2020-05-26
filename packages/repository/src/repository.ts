import { PhysicalStore, StoreManager } from '@furystack/core'
import { Constructable, Injectable, Injector } from '@furystack/inject'
import { Disposable } from '@furystack/utils'
import { ScopedLogger } from '@furystack/logging'
import { DataSetSettings } from './data-set-setting'
import { DataSet } from './data-set'

/**
 * Collection of authorized physical stores
 */
@Injectable({ lifetime: 'singleton' })
export class Repository implements Disposable {
  public dispose() {
    this.dataSets.clear()
  }

  private dataSets: Map<string, DataSet<any>> = new Map()

  public getDataSetFor<T>(model: Constructable<T> | string) {
    const modelName = typeof model !== 'string' ? model.name : model
    const instance = this.dataSets.get(modelName)
    if (!instance) {
      this.logger.error({
        message: `No DataSet found for '${modelName}'`,
      })
      throw Error(`No DataSet found for '${modelName}'`)
    }
    return instance as DataSet<T>
  }
  public createDataSet<T>(model: Constructable<T>, settings?: Partial<DataSetSettings<T, keyof T>>) {
    const physicalStore =
      (settings && settings.physicalStore) || (this.storeManager.getStoreFor(model) as PhysicalStore<T>)
    const name = (settings && settings.name) || model.name
    const instance = new DataSet({
      ...settings,
      physicalStore,
      name,
    })
    this.dataSets.set((settings && settings.name) || model.name, instance)
    return this
  }

  private logger: ScopedLogger

  constructor(private readonly storeManager: StoreManager, private readonly injector: Injector) {
    this.logger = this.injector.logger.withScope(`@furystack/repository/${this.constructor.name}`)
  }
}
