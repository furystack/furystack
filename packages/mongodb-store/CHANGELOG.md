# Changelog

## [10.0.39] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [10.0.38] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [10.0.37] - 2026-02-11

### ♻️ Refactoring

- Replaced semaphore-based initialization lock with promise deduplication for MongoDB collection setup. Concurrent calls to `getCollection()` now reuse a single in-flight initialization promise instead of queuing behind a semaphore. On initialization failure, the promise is reset to allow retry.

### ⬆️ Dependencies

- Bump `mongodb` from `7.0.0` to `7.1.0`
- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Removed `semaphore-async-await` dependency
- Updated internal dependencies

## [10.0.36] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [10.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [10.0.34] - 2026-01-26

### 🔧 Chores

- Fixed repository URL in package.json from `furystack/core` to `furystack/furystack`

## [10.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [10.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system
