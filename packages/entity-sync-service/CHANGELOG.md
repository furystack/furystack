# Changelog

## [1.0.11] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [1.0.10] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1
- Upgraded `ws` from ^8.19.0 to ^8.20.0

## [1.0.9] - 2026-03-19

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0
- Updated `@furystack/core` dependency to the latest major version.

## [1.0.8] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [1.0.7] - 2026-03-07

### ⬆️ Dependencies

- Updated internal FuryStack dependencies
- Updated `@furystack/rest-service` dependency

## [1.0.6] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [1.0.5] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/entity-sync-client` with new lifecycle events via EventHub
- Updated `@furystack/rest-service` with improved error handling for malformed requests

## [1.0.4] - 2026-02-27

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

## [1.0.3] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Updated `@furystack/rest-service` dependency to pick up the new `LoginResponseStrategy` abstraction
- Bumped due to updated workspace dependencies

## [1.0.2] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

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
