<!-- version-type: minor -->

# @furystack/auth-jwt

## 🗑️ Deprecated

- `onAccessTokenChanged` option — use `subscribe('onAccessTokenChanged', ...)` on the returned store instead
- `onRefreshTokenChanged` option — use `subscribe('onRefreshTokenChanged', ...)` on the returned store instead
- `onRefreshFailed` option — use `subscribe('onRefreshFailed', ...)` on the returned store instead

## ✨ Features

### EventHub-based token store events

`createJwtTokenStore` now uses an internal `EventHub` and exposes `subscribe`, `addListener`, and `removeListener` methods. This allows multiple consumers to observe token changes and refresh failures without passing callbacks through options.

```typescript
const store = createJwtTokenStore({ login, refresh })

store.subscribe('onAccessTokenChanged', (token) => {
  console.log('Access token changed:', token)
})

store.subscribe('onRefreshFailed', ({ error }) => {
  console.error('Refresh failed:', error)
})
```

The store is now `Disposable` via `Symbol.dispose`, which cleans up all internal listeners.

## 🧪 Tests

- Added tests for EventHub event emission (`onAccessTokenChanged`, `onRefreshTokenChanged`, `onRefreshFailed`)
- Added tests for `Symbol.dispose` cleanup
