<!-- version-type: patch -->

# @furystack/rest-service

## ♻️ Refactoring

- Replaced semaphore-based server creation lock with a `pendingCreates` Map for deduplicating concurrent `getOrCreate()` calls. In-flight server creation promises are now reused instead of serialized behind a semaphore.
- Simplified `[Symbol.asyncDispose]()` — disposal now awaits pending server creations directly instead of waiting on a semaphore lock with a timeout.

## ⬆️ Dependencies

- Removed `semaphore-async-await` dependency
