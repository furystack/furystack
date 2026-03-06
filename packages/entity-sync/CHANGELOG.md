# Changelog

## [1.0.5] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [1.0.4] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/utils` with EventHub listener error handling

## [1.0.3] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped due to updated workspace dependencies

## [1.0.2] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

## [1.0.1] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [1.0.0] - 2026-02-22

### 💥 Breaking Changes

### Added `collection-snapshot` variant to `ServerSyncMessage`

A new `collection-snapshot` variant has been added to the `ServerSyncMessage` union type. The server now sends a full snapshot (entries + count) whenever a collection changes, instead of individual diff messages. This ensures entries and count are always delivered together as a consistent unit.

Consumers that exhaustively match on `ServerSyncMessage.type` (without a `default`) must add a `collection-snapshot` case.

**Examples:**

```typescript
// ✅ Handle the new collection-snapshot message
switch (message.type) {
  case 'collection-snapshot':
    console.log(message.data, message.totalCount)
    break
  // ... other cases
}
```

**Impact:** Consumers that exhaustively match on `ServerSyncMessage.type` (without a `default`) will get a compile error until the new case is handled.

### ✨ Features

### Total count support for collection sync messages

- Added optional `totalCount` field to `snapshot` and `delta` server messages, reporting the total number of matching entities (ignoring `top`/`skip` pagination)
- Added `collection-snapshot` message type that delivers a full re-sync (entries + count) when a collection changes

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
