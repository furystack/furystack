<!-- version-type: minor -->

# @furystack/filesystem-store

## ✨ Features

### `onWatcherError` event for file system watcher failures

`FileSystemStore` now emits an `onWatcherError` event when registering the file system watcher fails, replacing silent error swallowing.

```typescript
const store = new FileSystemStore({
  fileName: '/data/entities.json',
  primaryKey: 'id',
  model: MyEntity,
})

store.addListener('onWatcherError', ({ error }) => {
  console.error('File watcher registration failed:', error)
})
```

- Added `onListenerError` to the event map for consistent EventHub error handling
