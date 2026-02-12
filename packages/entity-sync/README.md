# @furystack/entity-sync

Shared protocol types for FuryStack entity synchronization over WebSocket.

## Installation

```bash
npm install @furystack/entity-sync
# or
yarn add @furystack/entity-sync
```

## Overview

This package defines the wire protocol used between `@furystack/entity-sync-client` and `@furystack/entity-sync-service`. It exports only TypeScript types -- there is no runtime code.

### Protocol Flow

```
Client                                          Server
  │                                               │
  │──── subscribe-entity / subscribe-collection ──▶│
  │                                               │
  │◀──── subscribed (snapshot or delta) ──────────│
  │                                               │
  │◀──── entity-added / entity-updated / ─────────│
  │      entity-removed (incremental)             │
  │                                               │
  │──── unsubscribe ──────────────────────────────▶│
```

## Types

### `SyncVersion`

Version metadata included in all server sync messages:

```ts
type SyncVersion = {
  seq: number // Monotonically increasing sequence number per model
  timestamp: string // ISO 8601 timestamp
}
```

### `SyncChangeEntry`

A single entry in a delta replay, representing one change to an entity:

```ts
type SyncChangeEntry =
  | { type: 'added'; entity: unknown; version: SyncVersion }
  | { type: 'updated'; id: unknown; change: Record<string, unknown>; version: SyncVersion }
  | { type: 'removed'; id: unknown; version: SyncVersion }
```

### `ClientSyncMessage`

Messages sent from client to server:

- `subscribe-entity` -- subscribe to a single entity by primary key (with optional `lastSeq` for delta sync)
- `subscribe-collection` -- subscribe to a filtered, ordered collection (with optional `lastSeq`)
- `unsubscribe` -- remove a subscription by ID

### `ServerSyncMessage`

Messages sent from server to client:

- `subscribed` -- subscription confirmation with either a full `snapshot` or a `delta` (array of `SyncChangeEntry`)
- `entity-added` / `entity-updated` / `entity-removed` -- incremental changes pushed to active subscriptions
- `subscription-error` -- error response for a subscription request

### `SyncState<T>`

Client-side discriminated union representing the current state of a subscription:

```ts
type SyncState<T> =
  | { status: 'connecting' }
  | { status: 'cached'; data: T }
  | { status: 'suspended'; data: T }
  | { status: 'synced'; data: T }
  | { status: 'error'; error: string }
```
