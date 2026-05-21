# Changelog

## [3.0.0] - 2026-05-21

### 📚 Documentation

- Rewrote JSDoc on `SyncState` and the shared transport types to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints.

### 💥 Breaking Changes

### `SyncVersion.seq` and `ClientSyncMessage.lastSeq` are now opaque strings

`seq` is no longer a numeric counter assigned by the server — it is now an **opaque, ordered token** assigned by the underlying `@furystack/cross-node-bus` adapter (integer counters in-process, `<ms>-<n>` Redis Stream ids, etc.). Clients **must not** compare seqs lexicographically or numerically; the only safe operations are equality and round-tripping the value back to the server via `lastSeq`.

**Affected types:**

```typescript
type SyncVersion = {
  // ❌ Before
  seq: number
  // ✅ After
  seq: string
  timestamp: string
}

type ClientSyncMessage =
  | { type: 'subscribe-entity'; /* ... */ lastSeq?: string /* was: number */ }
  | { type: 'subscribe-collection'; /* ... */ lastSeq?: string /* was: number */ }
// ...
```

**Impact:** Any code that does arithmetic on `seq` (e.g. `seq + 1`, `seq > previous`) breaks. Any persisted client-side state holding `lastSeq: number` becomes incompatible.

**Migration:**

1. Replace numeric comparisons with equality checks. Adapter-specific ordering, when needed, lives behind the bus's `compareSeq(a, b)` — do not re-implement it.
2. Treat `seq` as a black-box token: store it, send it back, never inspect it.
3. Persisted client caches (e.g. `SyncCacheEntry` in `@furystack/entity-sync-client`) carry `lastSeq` typed as `number` from previous versions and will not load. Either drop the cache on upgrade or write a one-shot migration that converts numeric seqs to their string representation.

### ⬆️ Dependencies

- Re-released to pick up the bumped workspace dependency `@furystack/core`. No source changes — version bump only.

## [2.0.0] - 2026-04-25

### 💥 Breaking Changes

Version bumped to align with the monorepo-wide functional DI migration. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for the full picture.

- No direct API changes — this package only exports shared protocol types. Downstream consumers in `@furystack/entity-sync-service` and `@furystack/entity-sync-client` have moved to DI tokens; any code that imported types for use with those packages should check their respective changelogs.

## [1.0.11] - 2026-04-17

### ⬆️ Dependencies

- Raised the `typescript` devDependency to ^6.0.3 so the package compiles with the same compiler revision as the rest of the monorepo.

## [1.0.10] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [1.0.9] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2

## [1.0.8] - 2026-03-19

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0
- Updated `@furystack/core` dependency to the latest major version.

## [1.0.7] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [1.0.6] - 2026-03-07

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

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
