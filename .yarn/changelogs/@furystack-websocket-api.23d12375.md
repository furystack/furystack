<!-- version-type: minor -->

# @furystack/websocket-api

## ✨ Features

### Lifecycle and error events via `EventHub`

`WebSocketApi` now extends `EventHub` and emits structured events:

- `onError` — emitted when action execution fails (`canExecute`, `getInstance`, or `execute`), or when a WebSocket error occurs
- `onClientConnected` — emitted when a client connects, with `{ ws, message }`
- `onClientDisconnected` — emitted when a client disconnects, with `{ ws }`

```typescript
webSocketApi.addListener('onError', ({ error, data, socket }) => {
  logger.error('WebSocket action error', { error })
})

webSocketApi.addListener('onClientConnected', ({ ws, message }) => {
  logger.info('Client connected')
})
```

## ♻️ Refactoring

- Action execution now uses explicit try/catch and `Promise.resolve().then()` instead of `using()`, ensuring errors are properly caught and emitted rather than silently dropped
