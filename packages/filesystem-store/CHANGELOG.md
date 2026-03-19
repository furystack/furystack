# Changelog

## [7.1.4] - 2026-03-19

### ✨ Features

- Updated `@furystack/core` dependency to the latest major version.
- Added `onWatcherError` event for file system watcher failures.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [7.1.3] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [7.1.2] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`

## [7.1.1] - 2026-03-06

### 🧪 Tests

- Refactored `FileSystemStore` watcher error test to use `using()` wrapper for proper disposal, ensuring cleanup even if assertions fail

## [7.1.0] - 2026-03-03

### ✨ Features

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

## [7.0.40] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [7.0.39] - 2026-02-26

### 📝 Documentation

- Added tip about wrapping the physical store with a Repository DataSet for application-level data access

## [7.0.38] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [7.0.37] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [7.0.36] - 2026-02-11

### ♻️ Refactoring

- Removed semaphore-based file locking from all store operations (`get`, `add`, `find`, `count`, `remove`, `update`, `saveChanges`, `reloadData`). Operations now delegate directly to the in-memory store without lock wrapping.

### 🧪 Tests

- Wrapped `FileSystemStore` instances in `usingAsync()` to ensure cleanup runs even when assertions fail

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Removed `semaphore-async-await` dependency

## [7.0.35] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [7.0.34] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [7.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [7.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system
