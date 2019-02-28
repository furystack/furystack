import { IPhysicalStore } from '@furystack/core'
import { DataSet } from './DataSet'
import { DataSetSettings } from './DataSetSettings'

/**
 * A model that defines a collection of stores with a predefined name
 */
export interface StoreCollection {
  [key: string]: DataSet<any, any, any>
}

/**
 * Entry model for Physical Stores
 */
export interface StoreEntry<T, K extends keyof T, TFilter> {
  /**
   * The store instance
   */
  store: IPhysicalStore<T, K, TFilter>
  /**
   * Name of the collection (falls back to store name)
   */
  name?: string

  settings?: DataSetSettings<T, K, TFilter>
}

/**
 * Collection of authorized physical stores
 */
export interface Repository {
  stores: StoreCollection
}
