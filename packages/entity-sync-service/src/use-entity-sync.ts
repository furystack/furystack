import type { StoreToken } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { DataSetToken } from '@furystack/repository'
import type { ModelSyncOptions } from './subscription-manager.js'
import { SubscriptionManager } from './subscription-manager.js'

/**
 * Configuration for a data set to be synced. The wire-format model name is
 * derived from `dataSet.model.name`.
 */
export type EntitySyncModelConfig = {
  /** The DataSet token to sync. */
  dataSet: DataSetToken<unknown, never>
} & ModelSyncOptions

/**
 * Sets up entity synchronization for the given data sets.
 * Registers each DataSet with the {@link SubscriptionManager} for change
 * tracking.
 *
 * Must be called after the relevant stores and DataSets are configured
 * (all their backing {@link StoreToken}s must be bound on the injector).
 *
 * @param injector The injector instance
 * @param options Configuration with models to sync
 */
export const useEntitySync = (
  injector: Injector,
  options: {
    models: EntitySyncModelConfig[]
  },
): void => {
  const manager = injector.get(SubscriptionManager)
  for (const { dataSet, ...syncOptions } of options.models) {
    manager.registerModel(dataSet, syncOptions)
  }
}
