<!-- version-type: minor -->

# @furystack/websocket-api

## ✨ Features

### WebSocket connections close on cross-node logout

`useWebSocketApi` now subscribes to `IdentityEventBus`. When a `userLoggedOut` event fires — locally or from a sibling node via the bus — every WebSocket whose connect-time cookie carries the invalidated session id is closed with code `1008` ("Session invalidated").

```typescript
import { useWebSocketApi } from '@furystack/websocket-api'

await useWebSocketApi({ injector, port: 8080 })

const userContext = injector.get(HttpUserContext)
await userContext.cookieLogout(request, response)
// → publishes `userLoggedOut` on the bus
// → every node closes the affected sockets
```

This ties WebSocket lifecycle to identity invalidation across a horizontally-scaled deployment. Apps that have not bound a transport adapter run against the in-process default `CrossNodeBus` and only see the local effect — but the API surface is unchanged.

## 🐛 Bug Fixes

- WebSockets opened on the same node that processed a logout are now closed too. Previously the originating node only invalidated the identity cache; long-lived sockets stayed open until the client noticed.

## ⬆️ Dependencies

- Imports `IdentityEventBus`, `HttpAuthenticationSettings`, and `extractSessionIdFromCookies` from `@furystack/rest-service` (already a peer; no new packages introduced).
