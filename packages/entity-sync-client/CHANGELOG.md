# Changelog

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
