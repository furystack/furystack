# Changelog

## [1.0.3] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped due to updated workspace dependencies

## [1.0.2] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/rest-client-fetch` dependency

## [1.0.1] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [1.0.0] - 2026-02-22

### 💥 Breaking Changes

### `useCollectionSync` now returns `SyncState<{ entries: T[]; count: number }>` directly

The `useCollectionSync` hook return type changed from `{ state: SyncState<T[]>; totalCount: number | undefined }` to `SyncState<{ entries: T[]; count: number }>`. Entries and count are now part of the same sync state, ensuring they are always consistent.

**Examples:**

```typescript
// ❌ Before
const { state, totalCount } = useCollectionSync(options, ChatMessage, { filter })

if (state.status === 'synced') {
  console.log(state.data) // T[]
  console.log(`Total: ${totalCount}`)
}

// ✅ After
const messagesState = useCollectionSync(options, ChatMessage, { filter })

if (messagesState.status === 'synced') {
  console.log(messagesState.data.entries) // T[]
  console.log(`Total: ${messagesState.data.count}`)
}
```

**Impact:** All callers of `useCollectionSync` need to update. The return value is now a `SyncState` directly, with `data.entries` and `data.count` replacing the previous `state.data` and `totalCount`.

### `LiveCollection<T>` state type changed to `SyncState<{ entries: T[]; count: number }>`

The `LiveCollection<T>.state` observable type changed from `SyncState<T[]>` to `SyncState<{ entries: T[]; count: number }>`. The separate `totalCount` observable has been removed. Any code that manually constructs or reads `LiveCollection` must be updated.

### ✨ Features

### Unified collection sync state with entries and count

Collection subscriptions now deliver entries and count as a single atomic state update, ensuring they are always consistent. The count is no longer a separate observable that could be out of sync with the entries.

- `LiveCollection<T>.state` contains `{ entries: T[]; count: number }` in its data
- `useCollectionSync` returns a single `SyncState` with unified data
- The client handles the new `collection-snapshot` server message for live re-syncs

### 🧪 Tests

- Updated tests for unified collection state shape (`data.entries` / `data.count`)
- Updated `useCollectionSync` hook tests for the new return type
- Added tests verifying count is included in synced and cached states

## [0.2.0] - 2026-02-22

### ✨ Features

- `useCollectionSync` now uses `deps` for `top`, `skip`, and `order` options, keeping only the `filter` in the hook key. This allows the subscription to be re-created when pagination or ordering changes without creating a brand new cache entry.

### 🧪 Tests

- Added tests for `useEntitySync` covering subscription creation and re-creation on key change
- Added tests for `useCollectionSync` covering subscription creation, re-creation on option changes, and filter-based key partitioning

## [0.1.1] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/entity-sync`

## [0.1.0] - 2026-02-12

### ✨ Features

### New package: client-side entity synchronization

Initial release of `@furystack/entity-sync-client`, providing real-time, reactive data subscriptions over WebSocket.

Core features:

- **`EntitySyncService`** — manages WebSocket connections, subscriptions, and reconnection
- **`LiveEntity<T>`** / **`LiveCollection<T>`** — reference-counted subscription handles with `ObservableValue<SyncState<T>>` state
- **Auto-reconnect** — exponential backoff with configurable limits
- **Reference counting** — multiple subscribers share the same WebSocket subscription; auto-suspend after configurable delay when all observers detach
- **Delta sync** — sends `lastSeq` on reconnect to receive only incremental changes
- **Local caching** — pluggable `SyncCacheStore` for stale-while-revalidate pattern

### Shades hooks

- **`useEntitySync`** — subscribes to a single entity by primary key, returns reactive `SyncState<T>`
- **`useCollectionSync`** — subscribes to a filtered/ordered collection, returns reactive `SyncState<T[]>`

Both hooks handle subscription lifecycle automatically (subscribe on mount, dispose on unmount).

### ⬆️ Dependencies

- Added `@furystack/entity-sync` (workspace:^)
- Added `@furystack/inject` (workspace:^)
- Added `@furystack/utils` (workspace:^)

All notable changes to the `@furystack/entity-sync-client` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
