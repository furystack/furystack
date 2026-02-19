# Changelog

## [0.1.1] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [0.1.0] - 2026-02-12

### ✨ Features

### New package: shared protocol types for entity synchronization

Initial release of `@furystack/entity-sync`, providing the TypeScript types for the WebSocket-based entity synchronization protocol used between `@furystack/entity-sync-client` and `@furystack/entity-sync-service`.

Key types:

- `SyncVersion` — sequence number and timestamp metadata for change ordering
- `SyncChangeEntry` — discriminated union for added/updated/removed entity changes
- `ClientSyncMessage` — messages from client to server (subscribe-entity, subscribe-collection, unsubscribe)
- `ServerSyncMessage` — messages from server to client (subscribed snapshot/delta, incremental changes, errors)
- `SyncState<T>` — client-side discriminated union for subscription state (connecting, cached, suspended, synced, error)

### ⬆️ Dependencies

- Added `@furystack/core` (workspace:^) as a dependency

All notable changes to the `@furystack/entity-sync` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
