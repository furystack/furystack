# @furystack/websocket-api

WebSocket implementation for FuryStack.

## Installation

```bash
npm install @furystack/websocket-api
# or
yarn add @furystack/websocket-api
```

## Usage Example

`useWebSocketApi` boots a WebSocket endpoint on the shared HTTP server pool
managed by `@furystack/rest-service`. It takes the injector, port, optional
hostname and path, and a map of `WebSocketAction` descriptors.

```ts
import { createInjector } from '@furystack/inject'
import { useWebSocketApi } from '@furystack/websocket-api'
import { WhoAmI } from './actions/whoami.js'

const myInjector = createInjector()

const wsApi = useWebSocketApi({
  injector: myInjector,
  port: 8080,
  path: '/api/sockets',
  actions: { WhoAmI },
})

wsApi.subscribe('onConnect', ({ injector: connectionInjector }) => {
  // per-connection scope with an IdentityContext bound lazily
})
```

`useWebSocketApi` returns a handle exposing `subscribe` / `emit` for
`onConnect` / `onDisconnect` events and a `broadcast(cb)` helper. Action
failures are routed to `ServerTelemetryToken#onWebSocketActionFailed`.

### Implementing Your Own Actions

A `WebSocketAction` is a plain object with two methods:

```ts
import type { WebSocketAction } from '@furystack/websocket-api'
import { HttpUserContext } from '@furystack/rest-service'

export const WhoAmI: WebSocketAction = {
  canExecute: ({ data }) => {
    const msg = data.toString()
    return msg === 'whoami' || msg === 'whoami /claims'
  },
  execute: async ({ injector, request, socket }) => {
    try {
      const httpUser = injector.get(HttpUserContext)
      const currentUser = await httpUser.getCurrentUser(request)
      socket.send(JSON.stringify({ currentUser }))
    } catch {
      socket.send(JSON.stringify({ currentUser: null }))
    }
  },
}
```

The `injector` passed to `execute` is a per-message scope, so scoped
services resolve fresh for every message and any `onDispose` callbacks run
when the message has been handled.
