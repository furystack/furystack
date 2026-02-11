# Changelog

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
