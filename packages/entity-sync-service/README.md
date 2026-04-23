# @furystack/entity-sync-service

Server-side entity synchronization for FuryStack. Tracks changes to
DataSets and pushes incremental updates to connected WebSocket clients.

## Installation

```bash
npm install @furystack/entity-sync-service
# or
yarn add @furystack/entity-sync-service
```

## Setup

Use the `useEntitySync` helper after configuring your stores, DataSets, and
the WebSocket API:

```ts
import { createInjector } from '@furystack/inject'
import { useWebSocketApi } from '@furystack/websocket-api'
import { SyncSubscribeAction, SyncUnsubscribeAction, useEntitySync } from '@furystack/entity-sync-service'
// Your app's DataSet tokens
import { UserDataSet, ChatMessageDataSet } from './my-app/data-sets.js'

const injector = createInjector()

// Set up WebSocket API with sync actions
useWebSocketApi({
  injector,
  port: 8080,
  path: '/api/sync',
  actions: { SyncSubscribeAction, SyncUnsubscribeAction },
})

// Register DataSets for synchronization
useEntitySync(injector, {
  models: [UserDataSet, { dataSet: ChatMessageDataSet, debounceMs: 100 }],
})
```

A `DataSetToken` can be passed directly, or wrapped in an options object
when you need to customise retention / debounce / caching.

## Model Configuration

Each model registration accepts these options:

```ts
type EntitySyncModelConfig = {
  dataSet: DataSetToken<unknown, never>
  changelogRetentionMs?: number // How long to keep change entries for delta sync (default: 5 min)
  debounceMs?: number // Debounce window for batching notifications (default: 0 = immediate)
  queryTtlMs?: number // TTL for cached find() results on collections (default: 0 = no cache)
}
```

`modelName` and `primaryKey` are derived from the `DataSetToken`'s metadata,
so callers never have to repeat them.

## How It Works

The `SubscriptionManager` (singleton) tracks changes to registered DataSets:

1. **Change tracking** — listens to `onEntityAdded`, `onEntityUpdated`, `onEntityRemoved` events on the DataSet
2. **Changelog** — maintains a per-model changelog with sequence numbers for delta sync support
3. **Subscriptions** — when a client subscribes, the manager sends an initial snapshot (or delta if `lastSeq` is provided), then pushes incremental changes
4. **Debouncing** — optionally batches rapid changes before re-evaluating collection subscriptions
5. **Query caching** — optionally caches `find()` results for collection subscriptions to reduce database load

> **Important:** The sync system listens to **DataSet** events, not
> physical store events. All writes **must** go through the DataSet (via
> `dataSet.add()`, `dataSet.update()`, `dataSet.remove()`) for changes to
> be detected and pushed to clients. Writing directly to the physical
> store bypasses sync entirely — the `furystack/no-direct-store-token`
> lint rule guards against this.
>
> For server-side or background writes that don't have an HTTP user
> context, use `useSystemIdentityContext` from `@furystack/core` to create
> a scoped child injector with elevated privileges. See the
> [@furystack/repository README](../repository/README.md#server-side-writes-and-the-elevated-identitycontext)
> for a full example.

## WebSocket Actions

Two built-in action descriptors handle the sync protocol:

- `SyncSubscribeAction` — handles `subscribe-entity` and `subscribe-collection` messages
- `SyncUnsubscribeAction` — handles `unsubscribe` messages

These are standard `WebSocketAction` descriptors for `@furystack/websocket-api`
and should be passed in the `actions` map to `useWebSocketApi`.

## SubscriptionManager API

The `SubscriptionManager` is a singleton token. Resolve it directly for
advanced use cases:

```ts
import { SubscriptionManager } from '@furystack/entity-sync-service'

const manager = injector.get(SubscriptionManager)

// Register a DataSet (usually done via useEntitySync)
manager.registerModel(UserDataSet, { debounceMs: 100 })

// Notify an entity change (usually handled automatically via DataSet events)
manager.notifyEntityAdded(User, newUser)
manager.notifyEntityUpdated(User, userId, { name: 'New Name' })
manager.notifyEntityRemoved(User, userId)
```
