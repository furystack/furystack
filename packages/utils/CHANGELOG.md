# Changelog

## [8.2.0] - 2026-03-03

### ✨ Features

### Error handling in `EventHub` listeners

`EventHub.emit()` now catches synchronous throws and asynchronous rejections from listeners. Errors are routed to `onListenerError` subscribers when present, or logged via `console.error` otherwise.

A new `ListenerErrorPayload` type is exported for typing the error event:

```typescript
type MyEvents = {
  dataReceived: { items: string[] }
  onListenerError: ListenerErrorPayload
}

const hub = new EventHub<MyEvents>()

hub.subscribe('onListenerError', ({ event, error }) => {
  console.error(`Listener for "${String(event)}" failed:`, error)
})
```

### Configurable error handling in `ObservableValue`

`ObservableValueOptions` now accepts an `onError` callback, invoked when an observer callback or filter throws (sync) or rejects (async). All remaining observers are still notified even when one fails. Defaults to `console.error`.

```typescript
const value = new ObservableValue('initial', {
  onError: ({ error, observer }) => {
    myLogger.error('Observer failed', { error })
  },
})
```

### `Semaphore` for concurrent task limiting

New `Semaphore` class limits concurrent async task execution to a configurable number of slots. Extends `EventHub` with `taskStarted`, `taskCompleted`, and `taskFailed` events. Exposes `pendingCount`, `runningCount`, `completedCount`, and `failedCount` as `ObservableValue` counters for reactive state monitoring. Supports `AbortSignal` for cancellation of pending and running tasks.

```typescript
const semaphore = new Semaphore(3)

semaphore.pendingCount.subscribe((count) => console.log('Pending:', count))
semaphore.subscribe('taskCompleted', () => console.log('A task completed'))

const results = await Promise.all(urls.map((url) => semaphore.execute(({ signal }) => fetch(url, { signal }))))

semaphore[Symbol.dispose]()
```

### 🧪 Tests

- Added tests for `EventHub` listener error routing (sync throws, async rejections, `onListenerError` dispatch)
- Added tests for `ObservableValue` observer error handling (sync throws, async rejections, custom `onError` callback)
- Added tests for `Semaphore` (concurrent execution, abort signals, disposal, EventHub events, ObservableValue counters)

## [8.1.10] - 2026-02-11

### 🧪 Tests

- Wrapped `ObservableValue` instances in `using()` in all observable-value tests to ensure cleanup runs even when assertions fail

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`

## [8.1.9] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [8.1.8] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Revamped README with improved utility documentation and examples

### 🔧 Chores

- Migrated to centralized changelog management system
