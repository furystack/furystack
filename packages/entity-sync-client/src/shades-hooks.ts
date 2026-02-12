import type { Constructable, Injector } from '@furystack/inject'
import type { ObservableValue } from '@furystack/utils'
import type { FilterType, SyncState } from '@furystack/entity-sync'
import { EntitySyncService } from './entity-sync-service.js'

/**
 * Context required by the entity-sync Shades convenience hooks.
 * Compatible with the `RenderOptions` provided to Shade component render functions --
 * just pass the render options directly (or destructure the needed fields).
 */
export type SyncHookContext = {
  injector: Injector
  useDisposable: <T extends Disposable>(key: string, factory: () => T) => T
  useObservable: <T>(key: string, observable: ObservableValue<T>) => [value: T, setValue: (newValue: T) => void]
}

/**
 * Shades convenience hook for subscribing to a single entity via EntitySyncService.
 * Manages the subscription lifecycle (subscribe on mount, dispose on unmount)
 * and returns the current sync state reactively.
 *
 * @param context Render options from the Shade component (or a subset with injector, useDisposable, useObservable)
 * @param model The model class
 * @param key The entity's primary key value
 * @returns The current SyncState for the entity
 *
 * @example
 * ```typescript
 * const UserProfile = Shade<{ userId: string }>({
 *   shadowDomName: 'user-profile',
 *   render: (options) => {
 *     const userState = useEntitySync(options, User, options.props.userId)
 *
 *     if (userState.status === 'connecting') return <div>Loading...</div>
 *     if (userState.status === 'error') return <div>Error: {userState.error}</div>
 *
 *     return <div>{userState.data?.name}</div>
 *   },
 * })
 * ```
 */
export const useEntitySync = <T>(
  context: SyncHookContext,
  model: Constructable<T>,
  key: unknown,
): SyncState<T | undefined> => {
  const syncService = context.injector.getInstance(EntitySyncService)
  const hookKey = `entitySync:${model.name}:${String(key)}`
  const liveEntity = context.useDisposable(hookKey, () => syncService.subscribeEntity(model, key))
  const [state] = context.useObservable(hookKey, liveEntity.state)
  return state
}

/**
 * Shades convenience hook for subscribing to a collection of entities via EntitySyncService.
 * Manages the subscription lifecycle (subscribe on mount, dispose on unmount)
 * and returns the current sync state reactively.
 *
 * @param context Render options from the Shade component (or a subset with injector, useDisposable, useObservable)
 * @param model The model class
 * @param options Optional filter, pagination, and ordering options
 * @returns The current SyncState for the collection
 *
 * @example
 * ```typescript
 * const ChatMessages = Shade<{ roomId: string }>({
 *   shadowDomName: 'chat-messages',
 *   render: (options) => {
 *     const messagesState = useCollectionSync(options, ChatMessage, {
 *       filter: { roomId: { $eq: options.props.roomId } },
 *     })
 *
 *     if (messagesState.status === 'connecting') return <div>Loading...</div>
 *     if (messagesState.status === 'error') return <div>Error: {messagesState.error}</div>
 *
 *     return (
 *       <div>
 *         {messagesState.data.map((msg) => <div>{msg.text}</div>)}
 *       </div>
 *     )
 *   },
 * })
 * ```
 */
export const useCollectionSync = <T>(
  context: SyncHookContext,
  model: Constructable<T>,
  options?: {
    filter?: FilterType<T>
    top?: number
    skip?: number
    order?: { [P in keyof T]?: 'ASC' | 'DESC' }
  },
): SyncState<T[]> => {
  const syncService = context.injector.getInstance(EntitySyncService)
  const optionsKey = JSON.stringify({
    filter: options?.filter,
    top: options?.top,
    skip: options?.skip,
    order: options?.order,
  })
  const hookKey = `collectionSync:${model.name}:${optionsKey}`
  const liveCollection = context.useDisposable(hookKey, () => syncService.subscribeCollection(model, options))
  const [state] = context.useObservable(hookKey, liveCollection.state)
  return state
}
