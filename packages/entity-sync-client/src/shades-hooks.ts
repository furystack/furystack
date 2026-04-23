import type { Constructable } from '@furystack/core'
import type { Injector, Token } from '@furystack/inject'
import type { ObservableValue } from '@furystack/utils'
import type { FilterType, SyncState } from '@furystack/entity-sync'
import type { EntitySyncService } from './entity-sync-service.js'

/**
 * Context required by the entity-sync Shades convenience hooks.
 * Compatible with the `RenderOptions` provided to Shade component render functions --
 * just pass the render options directly (or destructure the needed fields).
 */
export type SyncHookContext = {
  injector: Injector
  useDisposable: <T extends Disposable>(key: string, factory: () => T, deps?: readonly unknown[]) => T
  useObservable: <T>(key: string, observable: ObservableValue<T>) => [value: T, setValue: (newValue: T) => void]
}

/**
 * Bundle returned by {@link createSyncHooks}. Exposes shades hooks bound to
 * an application-specific {@link EntitySyncService} token.
 */
export interface SyncHooks {
  /** Shades hook that subscribes to a single entity. */
  useEntitySync: <T>(context: SyncHookContext, model: Constructable<T>, key: unknown) => SyncState<T | undefined>
  /** Shades hook that subscribes to a filtered collection. */
  useCollectionSync: <T>(
    context: SyncHookContext,
    model: Constructable<T>,
    options?: {
      filter?: FilterType<T>
      top?: number
      skip?: number
      order?: { [P in keyof T]?: 'ASC' | 'DESC' }
    },
  ) => SyncState<{ entries: T[]; count: number }>
}

/**
 * Creates a bundle of Shades convenience hooks bound to the provided
 * {@link EntitySyncService} token. Declare the token once with
 * {@link defineEntitySyncService} at module scope, build the hooks alongside
 * it and reuse them across components.
 *
 * The returned `useEntitySync` / `useCollectionSync` hooks subscribe on
 * mount, dispose on unmount and expose the current {@link SyncState}
 * reactively.
 *
 * @example
 * ```ts
 * export const AppEntitySync = defineEntitySyncService({ wsUrl: 'ws://localhost/sync' })
 * export const { useEntitySync, useCollectionSync } = createSyncHooks(AppEntitySync)
 * ```
 */
export const createSyncHooks = (syncToken: Token<EntitySyncService, 'singleton'>): SyncHooks => {
  const useEntitySync = <T>(
    context: SyncHookContext,
    model: Constructable<T>,
    key: unknown,
  ): SyncState<T | undefined> => {
    const syncService = context.injector.get(syncToken)
    const hookKey = `entitySync:${model.name}:${String(key)}`
    const liveEntity = context.useDisposable(hookKey, () => syncService.subscribeEntity(model, key))
    const [state] = context.useObservable(hookKey, liveEntity.state)
    return state
  }

  const useCollectionSync = <T>(
    context: SyncHookContext,
    model: Constructable<T>,
    options?: {
      filter?: FilterType<T>
      top?: number
      skip?: number
      order?: { [P in keyof T]?: 'ASC' | 'DESC' }
    },
  ): SyncState<{ entries: T[]; count: number }> => {
    const syncService = context.injector.get(syncToken)
    const filterKey = JSON.stringify(options?.filter)
    const hookKey = `collectionSync:${model.name}:${filterKey}`
    const deps = [options?.top, options?.skip, JSON.stringify(options?.order)] as const
    const liveCollection = context.useDisposable(hookKey, () => syncService.subscribeCollection(model, options), deps)
    const [state] = context.useObservable(hookKey, liveCollection.state)
    return state
  }

  return { useEntitySync, useCollectionSync }
}
