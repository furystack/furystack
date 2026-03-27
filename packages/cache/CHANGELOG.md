# Changelog

## [6.1.4] - 2026-03-27

### ✨ Features

- Exported `CacheSettings` interface, allowing consumers to reference cache configuration types directly

### 🐛 Bug Fixes

- Fixed `reload()` not resetting stale and cache time timers — reloaded entries would never become obsolete or get evicted on schedule

### ♻️ Refactoring

- Extracted timer setup into a dedicated `setupTimers()` method reused by both initial load and reload paths

### 🧪 Tests

- Added tests verifying that stale time and cache time timers are correctly restarted after calling `reload()`

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [6.1.3] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [6.1.2] - 2026-03-19

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [6.1.1] - 2026-03-06

### 📦 Build

- Updated TypeScript project references

## [6.1.0] - 2026-03-03

### ✨ Features

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

### 🧪 Tests

- Added test verifying `onLoadError` is emitted on background load failure

## [6.0.0] - 2026-02-11

### 🐛 Bug Fixes

- Fixed `obsoleteRange()` throwing `CannotObsoleteUnloadedError` when the cache contains entries in non-loaded states (loading or failed). Non-loaded entries are now skipped instead of attempting to mark them as obsolete.
- Fixed `removeRange()` throwing when evaluating entries in non-loaded states. Non-loaded entries are now skipped instead of accessing `.value` on them.

### ♻️ Refactoring

- Replaced `CacheLockManager` (backed by `semaphore-async-await`) with a `pendingLoads` Map that deduplicates concurrent `get()` and `reload()` calls by reusing in-flight promises

### 🧪 Tests

- Added tests verifying `obsoleteRange()` skips entries in `loading` and `failed` states without throwing
- Added tests verifying `removeRange()` skips entries in `loading` and `failed` states without throwing
- Wrapped all disposable resources in `using()` / `usingAsync()` to ensure cleanup runs even when assertions fail

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Removed `semaphore-async-await` dependency

### 💥 Breaking Changes

- Removed the exported `CacheLockManager` class — if you imported it directly, remove the import (no replacement needed, locking is now handled internally)
- Removed the `UninitializedCacheResult` type from the `CacheResult` union — replace `status === 'uninitialized'` checks with `status === 'loading'`
- Cache entries now start in `loading` state instead of `uninitialized`

## [5.0.29] - 2026-02-09

### 🧪 Tests

- Replaced `sleepAsync` with Vitest fake timers (`vi.useFakeTimers` / `vi.advanceTimersByTimeAsync`) in async cache tests to make them deterministic and faster

### ⬆️ Dependencies

- Updated `@furystack/*` dependencies

## [5.0.28] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [5.0.27] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [5.0.26] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Improved README with clearer examples and better structure

### 🔧 Chores

- Migrated to centralized changelog management system
