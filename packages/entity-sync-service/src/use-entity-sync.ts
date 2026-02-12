import type { Constructable, Injector } from '@furystack/inject'
import type { ModelSyncOptions } from './subscription-manager.js'
import { SubscriptionManager } from './subscription-manager.js'

/**
 * Configuration for a model to be synced
 */
export type EntitySyncModelConfig = {
  /** The model class (wire name derived from constructor.name) */
  model: Constructable<unknown>
  /** The primary key field name */
  primaryKey: string
} & ModelSyncOptions

/**
 * Sets up entity synchronization for the given models.
 * Registers each model with the SubscriptionManager for change tracking.
 *
 * Must be called after the Repository and DataSets are configured.
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
  const manager = injector.getInstance(SubscriptionManager)
  for (const { model, primaryKey, ...syncOptions } of options.models) {
    manager.registerModel(model, primaryKey, syncOptions)
  }
}
