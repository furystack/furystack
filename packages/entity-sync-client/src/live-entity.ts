import type { ObservableValue } from '@furystack/utils'
import type { SyncState } from '@furystack/entity-sync'

/**
 * A live, reactive entity subscription handle.
 * Multiple subscribers to the same entity share the same LiveEntity instance (reference counted).
 * Disposing the handle decrements the ref count; when all handles are disposed,
 * the subscription is suspended after `suspendDelayMs`.
 */
export type LiveEntity<T> = {
  /** Observable state that emits SyncState changes for the subscribed entity */
  state: ObservableValue<SyncState<T | undefined>>
  /** Dispose this handle (decrements ref count) */
  [Symbol.dispose](): void
}
