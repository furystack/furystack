<!-- version-type: patch -->

# @furystack/filesystem-store

## ♻️ Refactoring

- Removed semaphore-based file locking from all store operations (`get`, `add`, `find`, `count`, `remove`, `update`, `saveChanges`, `reloadData`). Operations now delegate directly to the in-memory store without lock wrapping.

## ⬆️ Dependencies

- Removed `semaphore-async-await` dependency
