import type { ObservableValue } from '@furystack/utils'
import type { SyncState } from '@furystack/entity-sync'

/**
 * A live, reactive collection subscription handle.
 * Multiple subscribers to the same collection share the same LiveCollection instance (reference counted).
 * Disposing the handle decrements the ref count; when all handles are disposed,
 * the subscription is suspended after `suspendDelayMs`.
 */
export type LiveCollection<T> = {
  /** Observable state that emits SyncState changes for the subscribed collection */
  state: ObservableValue<SyncState<T[]>>
  /** Dispose this handle (decrements ref count) */
  [Symbol.dispose](): void
}
