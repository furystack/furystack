# @furystack/entity-sync-service

Server-side entity synchronization for FuryStack. Tracks changes to repository DataSets and pushes incremental updates to connected WebSocket clients.

## Installation

```bash
npm install @furystack/entity-sync-service
# or
yarn add @furystack/entity-sync-service
```

## Setup

Use the `useEntitySync` helper after configuring your Repository and WebSocket API:

```ts
import { Injector } from '@furystack/inject'
import { useWebsockets } from '@furystack/websocket-api'
import { SyncSubscribeAction, SyncUnsubscribeAction, useEntitySync } from '@furystack/entity-sync-service'

const injector = new Injector()

// Set up WebSocket API with sync actions
await useWebsockets(injector, {
  path: '/api/sync',
  actions: [SyncSubscribeAction, SyncUnsubscribeAction],
})

// Register models for synchronization
useEntitySync(injector, {
  models: [
    { model: User, primaryKey: 'id' },
    { model: ChatMessage, primaryKey: 'id', debounceMs: 100 },
  ],
})
```

## Model Configuration

Each model registration accepts these options:

```ts
type EntitySyncModelConfig = {
  model: Constructable<unknown>
  primaryKey: string
  changelogRetentionMs?: number // How long to keep change entries for delta sync (default: 5 min)
  debounceMs?: number // Debounce window for batching notifications (default: 0 = immediate)
  queryTtlMs?: number // TTL for cached find() results on collections (default: 0 = no cache)
}
```

## How It Works

The `SubscriptionManager` (singleton) tracks changes to registered models:

1. **Change tracking** -- listens to `onEntityAdded`, `onEntityUpdated`, `onEntityRemoved` events on the model's DataSet
2. **Changelog** -- maintains a per-model changelog with sequence numbers for delta sync support
3. **Subscriptions** -- when a client subscribes, the manager sends an initial snapshot (or delta if `lastSeq` is provided), then pushes incremental changes
4. **Debouncing** -- optionally batches rapid changes before re-evaluating collection subscriptions
5. **Query caching** -- optionally caches `find()` results for collection subscriptions to reduce database load

## WebSocket Actions

Two built-in actions handle the sync protocol:

- `SyncSubscribeAction` -- handles `subscribe-entity` and `subscribe-collection` messages
- `SyncUnsubscribeAction` -- handles `unsubscribe` messages

These are standard `@furystack/websocket-api` actions and should be passed to `useWebsockets`.

## SubscriptionManager API

The `SubscriptionManager` is an `@Injectable` singleton. You can access it directly for advanced use cases:

```ts
const manager = injector.getInstance(SubscriptionManager)

// Register a model for sync
manager.registerModel(User, 'id', { debounceMs: 100 })

// Notify an entity change (usually handled automatically via DataSet events)
manager.notifyEntityAdded(User, newUser)
manager.notifyEntityUpdated(User, userId, { name: 'New Name' })
manager.notifyEntityRemoved(User, userId)
```
