<!-- version-type: minor -->

# @furystack/entity-sync-client

## ✨ Features

### Lifecycle events via `EventHub`

`EntitySyncService` now extends `EventHub` and emits events for connection lifecycle and errors:

- `onConnect` — emitted when the WebSocket connection is established
- `onDisconnect` — emitted when the connection is lost or closed
- `onReconnectAttempt` — emitted when a reconnection attempt is scheduled, with `{ attempt }` count
- `onReconnectFailed` — emitted when a reconnect attempt fails, with `{ attempt }` count
- `onMessageError` — emitted when parsing an incoming message throws
- `onCacheError` — emitted when a cache store operation fails, with `{ cacheKey, error }`

## 🐛 Bug Fixes

- Incoming WebSocket message parsing is now wrapped in try/catch — malformed messages emit `onMessageError` instead of crashing the service
