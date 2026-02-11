<!-- version-type: patch -->

# @furystack/mongodb-store

## ♻️ Refactoring

- Replaced semaphore-based initialization lock with promise deduplication for MongoDB collection setup. Concurrent calls to `getCollection()` now reuse a single in-flight initialization promise instead of queuing behind a semaphore. On initialization failure, the promise is reset to allow retry.

## ⬆️ Dependencies

- Removed `semaphore-async-await` dependency
