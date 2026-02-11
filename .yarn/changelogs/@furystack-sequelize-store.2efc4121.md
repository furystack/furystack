<!-- version-type: patch -->

# @furystack/sequelize-store

## 🐛 Bug Fixes

- Fixed `getModel()` returning `this.sequelizeModel` (the unsynced static model) instead of the synced `model` instance after initialization

## ♻️ Refactoring

- Replaced semaphore-based initialization lock with promise deduplication for Sequelize model setup. Concurrent calls to `getModel()` now reuse a single in-flight initialization promise instead of queuing behind a semaphore. On initialization failure, the promise is reset to allow retry.

## ⬆️ Dependencies

- Removed `semaphore-async-await` dependency
