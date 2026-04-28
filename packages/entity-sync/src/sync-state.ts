/**
 * Discriminated union over the lifecycle of a subscribed entity or
 * collection on the client:
 *
 * - `connecting` — handshake in progress, no `data` yet (or first load).
 * - `cached` — local cache hit; rendering immediately while a `delta` sync
 *   confirms freshness.
 * - `suspended` — connection dropped; the last-known `data` is still
 *   served while reconnect attempts run in the background.
 * - `synced` — server confirmed our seq matches; `data` is authoritative.
 * - `error` — terminal: subscription rejected; `error` carries the reason.
 *
 * Discriminate on `status` to narrow.
 */
export type SyncState<T> =
  | { status: 'connecting' }
  | { status: 'cached'; data: T }
  | { status: 'suspended'; data: T }
  | { status: 'synced'; data: T }
  | { status: 'error'; error: string }
