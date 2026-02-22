# Changelog

## [1.0.1] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [1.0.0] - 2026-02-22

### 💥 Breaking Changes

### Collection subscriptions now send full snapshots instead of incremental diffs

The `SubscriptionManager` no longer sends individual `entity-added`/`entity-updated`/`entity-removed` messages for collection subscription changes. Instead, it sends a single `collection-snapshot` message containing the full entries array and total count whenever a collection's data or count changes. This ensures the client always receives a consistent view of entries and count together.

See `@furystack/entity-sync` changelog for protocol-level details.

### ✨ Features

### Server-side total count tracking for collection subscriptions

The `SubscriptionManager` computes and delivers the total count of entities matching a collection filter (ignoring `top`/`skip` pagination).

- Initial `snapshot` responses include a `totalCount` field
- When entities change and the collection is re-evaluated, the server sends a `collection-snapshot` with updated entries and count
- Count queries run in parallel with data queries via `Promise.all` to minimize latency

### 🧪 Tests

- Added tests verifying that `totalCount` is included in initial snapshot responses
- Updated collection change notification tests to verify `collection-snapshot` messages
- Tests verify that redundant snapshots are suppressed when nothing changed

## [0.1.2] - 2026-02-20

### ⬆️ Dependencies

- Updated `@furystack/repository` and `@furystack/rest-service` dependencies

## [0.1.1] - 2026-02-19

### 📚 Documentation

- Expanded JSDoc on `SubscriptionManager.registerModel()` to clarify that only DataSet writes trigger sync notifications, and direct physical store writes are not detected
- Updated README to emphasize that all writes must go through the DataSet for entity sync to work, and to reference `useSystemIdentityContext` for server-side writes without an HTTP session

## [0.1.0] - 2026-02-12

### ✨ Features

### New package: server-side entity synchronization

Initial release of `@furystack/entity-sync-service`, providing server-side change tracking and WebSocket push for entity synchronization.

Core features:

- **`SubscriptionManager`** — singleton service that tracks per-model changelogs with sequence numbers, manages entity and collection subscriptions, and dispatches incremental updates to connected WebSocket clients
- **`useEntitySync`** — helper function to register models for synchronization after Repository and DataSets are configured
- **`SyncSubscribeAction`** / **`SyncUnsubscribeAction`** — WebSocket actions compatible with `@furystack/websocket-api`
- **Delta sync** — maintains a per-model changelog for sending only changes since client's `lastSeq`
- **Debounced notifications** — configurable debounce window for batching rapid changes before re-evaluating collection subscriptions
- **Query caching** — optional TTL-based caching for `find()` results on collection subscriptions

### ⬆️ Dependencies

- Added `@furystack/core` (workspace:^)
- Added `@furystack/entity-sync` (workspace:^)
- Added `@furystack/inject` (workspace:^)
- Added `@furystack/repository` (workspace:^)
- Added `@furystack/websocket-api` (workspace:^)
- Added `ws` ^8.19.0

All notable changes to the `@furystack/entity-sync-service` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
