/**
 * Client-side sync state for a subscribed entity or collection
 */
export type SyncState<T> =
  | { status: 'connecting' }
  | { status: 'cached'; data: T }
  | { status: 'suspended'; data: T }
  | { status: 'synced'; data: T }
  | { status: 'error'; error: string }
