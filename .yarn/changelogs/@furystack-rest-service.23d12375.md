<!-- version-type: minor -->

# @furystack/rest-service

## ✨ Features

### Server lifecycle events in `ServerManager`

`ServerManager` now emits `onServerListening` and `onServerClosed` events, allowing consumers to observe when HTTP servers start and stop:

```typescript
serverManager.addListener('onServerListening', ({ url, port, hostName }) => {
  console.log(`Server listening at ${url}`)
})

serverManager.addListener('onServerClosed', ({ url }) => {
  console.log(`Server at ${url} closed`)
})
```

### Authentication events in `HttpUserContext`

`HttpUserContext` now extends `EventHub` and emits `onLogin`, `onLogout`, and `onSessionInvalidated` events for authentication lifecycle observability.

### `onListenerError` support

`ServerManager`, `ProxyManager`, and `HttpUserContext` event maps now include `onListenerError` for consistent listener error handling.
