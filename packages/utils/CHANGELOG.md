# Changelog

## [9.0.0] - 2026-04-25

### 💥 Breaking Changes

- Version bumped to align with the monorepo-wide functional DI migration. No DI surface in this package; `ObservableValue`, `EventHub`, `Semaphore`, `Retrier`, `using` / `usingAsync`, and related primitives are unchanged. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for the full picture on other packages.

## [8.2.5] - 2026-04-17

### ⬆️ Dependencies

- Raised `typescript` to ^6.0.3 and `vitest` to ^4.1.4 so package builds and tests track the workspace toolchain.

## [8.2.4] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [8.2.3] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### 🧪 Tests

- Added missing `.js` extension to bare module import in test file for TypeScript 6 strict module resolution

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [8.2.2] - 2026-03-19

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [8.2.1] - 2026-03-06

### 🧪 Tests

- Refactored all `Semaphore` tests to use `using()` / `usingAsync()` wrappers for proper disposal, ensuring cleanup even if assertions fail
- Added `eslint-disable` comment in `EventHub` test for intentional post-disposal behavior verification

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
