# @furystack/entity-sync-client

Client-side entity synchronization for FuryStack. Provides reactive, real-time data subscriptions over WebSocket with automatic reconnection, reference counting, local caching, and delta sync.

## Installation

```bash
npm install @furystack/entity-sync-client
# or
yarn add @furystack/entity-sync-client
```

## Setup

`defineEntitySyncService(options)` mints a per-app singleton token. Declare
the token once at module scope and reuse it; inlining the call each time
defeats singleton caching.

```ts
import { createInjector } from '@furystack/inject'
import { defineEntitySyncService } from '@furystack/entity-sync-client'

export const AppSync = defineEntitySyncService({
  wsUrl: 'ws://localhost:8080/api/sync',
})

const injector = createInjector()
const syncService = injector.get(AppSync)
```

### Options

```ts
type EntitySyncServiceOptions = {
  wsUrl: string
  suspendDelayMs?: number // Default: 1000
  createWebSocket?: (url: string) => WebSocket
  localStore?: SyncCacheStore // For stale-while-revalidate
  reconnect?: boolean // Default: true
  reconnectBaseMs?: number // Default: 1000
  reconnectMaxMs?: number // Default: 30000
  maxReconnectAttempts?: number // Default: Infinity
}
```

## Subscribing to Entities

Subscribe to a single entity by primary key:

```ts
using liveEntity = syncService.subscribeEntity(User, 'user-1')

liveEntity.state.subscribe((state) => {
  if (state.status === 'synced') {
    console.log('User data:', state.data)
  }
})
```

## Subscribing to Collections

Subscribe to a filtered collection:

```ts
using liveCollection = syncService.subscribeCollection(ChatMessage, {
  filter: { roomId: { $eq: 'room-42' } },
  order: { createdAt: 'DESC' },
  top: 50,
})

liveCollection.state.subscribe((state) => {
  if (state.status === 'synced') {
    console.log('Messages:', state.data)
  }
})
```

## Shades Hooks

`createSyncHooks(syncToken)` returns `{ useEntitySync, useCollectionSync }`
hooks bound to the caller-supplied token. Declare the token + hooks
together at module scope and reuse them across components.

```ts
import { defineEntitySyncService, createSyncHooks } from '@furystack/entity-sync-client'

export const AppSync = defineEntitySyncService({ wsUrl: 'ws://localhost:8080/api/sync' })
export const { useEntitySync, useCollectionSync } = createSyncHooks(AppSync)
```

### `useEntitySync`

```tsx
import { Shade } from '@furystack/shades'
import { useEntitySync } from './my-app/sync.js'

const UserProfile = Shade<{ userId: string }>({
  customElementName: 'user-profile',
  render: (options) => {
    const userState = useEntitySync(options, User, options.props.userId)

    if (userState.status === 'connecting') return <div>Loading...</div>
    if (userState.status === 'error') return <div>Error: {userState.error}</div>

    return <div>{userState.data?.name}</div>
  },
})
```

### `useCollectionSync`

```tsx
import { Shade } from '@furystack/shades'
import { useCollectionSync } from './my-app/sync.js'

const ChatMessages = Shade<{ roomId: string }>({
  customElementName: 'chat-messages',
  render: (options) => {
    const messagesState = useCollectionSync(options, ChatMessage, {
      filter: { roomId: { $eq: options.props.roomId } },
    })

    if (messagesState.status === 'connecting') return <div>Loading...</div>
    if (messagesState.status === 'error') return <div>Error: {messagesState.error}</div>

    return (
      <div>
        <p>Total: {messagesState.data.count}</p>
        {messagesState.data.entries.map((msg) => (
          <div>{msg.text}</div>
        ))}
      </div>
    )
  },
})
```

## Local Caching

Enable stale-while-revalidate with a cache store:

```ts
import { defineEntitySyncService, createInMemoryCacheStore } from '@furystack/entity-sync-client'

export const AppSync = defineEntitySyncService({
  wsUrl: 'ws://localhost:8080/api/sync',
  localStore: createInMemoryCacheStore(),
})
```

When cached data is available, the state will be `{ status: 'cached', data: ... }` while reconnecting. On reconnect, the client sends `lastSeq` to request only the changes since the last known state (delta sync).

You can implement the `SyncCacheStore` interface for persistent storage (e.g., IndexedDB).

## Features

- **Reference counting** -- multiple subscribers share the same WebSocket subscription
- **Auto-suspend** -- subscriptions with no observers are suspended after a configurable delay
- **Auto-reconnect** -- exponential backoff reconnection with configurable limits
- **Delta sync** -- sends `lastSeq` on reconnect to receive only incremental changes
- **Local caching** -- stale-while-revalidate pattern with pluggable storage
- **Reactive state** -- `ObservableValue<SyncState<T>>` for each subscription
