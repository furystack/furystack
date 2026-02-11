# Changelog

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
