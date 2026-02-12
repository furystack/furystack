# @furystack/entity-sync-client

Client-side entity synchronization for FuryStack. Provides reactive, real-time data subscriptions over WebSocket with automatic reconnection, reference counting, local caching, and delta sync.

## Installation

```bash
npm install @furystack/entity-sync-client
# or
yarn add @furystack/entity-sync-client
```

## Setup

Register the `EntitySyncService` with your injector:

```ts
import { Injector } from '@furystack/inject'
import { EntitySyncService } from '@furystack/entity-sync-client'

const injector = new Injector()

const syncService = injector.setExplicitInstance(
  new EntitySyncService({
    wsUrl: 'ws://localhost:8080/api/sync',
  }),
)
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

Convenience hooks for `@furystack/shades` components that handle subscription lifecycle automatically:

### `useEntitySync`

```tsx
import { Shade } from '@furystack/shades'
import { useEntitySync } from '@furystack/entity-sync-client'

const UserProfile = Shade<{ userId: string }>({
  shadowDomName: 'user-profile',
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
import { useCollectionSync } from '@furystack/entity-sync-client'

const ChatMessages = Shade<{ roomId: string }>({
  shadowDomName: 'chat-messages',
  render: (options) => {
    const messagesState = useCollectionSync(options, ChatMessage, {
      filter: { roomId: { $eq: options.props.roomId } },
    })

    if (messagesState.status === 'connecting') return <div>Loading...</div>
    if (messagesState.status === 'error') return <div>Error: {messagesState.error}</div>

    return (
      <div>
        {messagesState.data.map((msg) => (
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
import { EntitySyncService, createInMemoryCacheStore } from '@furystack/entity-sync-client'

const syncService = new EntitySyncService({
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
