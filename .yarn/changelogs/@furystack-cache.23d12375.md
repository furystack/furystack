<!-- version-type: minor -->

# @furystack/cache

## ✨ Features

### `onLoadError` event for background cache loads

`Cache` now extends `EventHub` and emits an `onLoadError` event when a background load fails. Previously, errors from background cache population were silently swallowed.

```typescript
const cache = new Cache<string, [string]>({
  load: async (key) => fetchData(key),
  capacity: 100,
})

cache.addListener('onLoadError', ({ args, error }) => {
  console.error(`Cache load failed for key ${args[0]}:`, error)
})
```

## 🧪 Tests

- Added test verifying `onLoadError` is emitted on background load failure
