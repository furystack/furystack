<!-- version-type: patch -->

# @furystack/cache

## 🐛 Bug Fixes

- Fixed `obsoleteRange()` throwing `CannotObsoleteUnloadedError` when the cache contains entries in non-loaded states (loading or failed). Non-loaded entries are now skipped instead of attempting to mark them as obsolete.
- Fixed `removeRange()` throwing when evaluating entries in non-loaded states. Non-loaded entries are now skipped instead of accessing `.value` on them.

## ♻️ Refactoring

- Replaced `CacheLockManager` (backed by `semaphore-async-await`) with a `pendingLoads` Map that deduplicates concurrent `get()` and `reload()` calls by reusing in-flight promises
- Removed the `UninitializedCacheResult` state — new cache entries now start in `loading` state directly
- Removed the exported `CacheLockManager` class

## 🧪 Tests

- Added tests verifying `obsoleteRange()` skips entries in `loading` and `failed` states without throwing
- Added tests verifying `removeRange()` skips entries in `loading` and `failed` states without throwing

## ⬆️ Dependencies

- Removed `semaphore-async-await` dependency
