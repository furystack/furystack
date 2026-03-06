# Changelog

## [6.0.43] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [6.0.42] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/utils` with EventHub listener error handling

## [6.0.41] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [6.0.40] - 2026-02-26

### 📝 Documentation

- Added tip about wrapping the physical store with a Repository DataSet for application-level data access

## [6.0.39] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [6.0.38] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [6.0.37] - 2026-02-11

### 🐛 Bug Fixes

- Fixed `getModel()` returning `this.sequelizeModel` (the unsynced static model) instead of the synced `model` instance after initialization

### ♻️ Refactoring

- Replaced semaphore-based initialization lock with promise deduplication for Sequelize model setup. Concurrent calls to `getModel()` now reuse a single in-flight initialization promise instead of queuing behind a semaphore. On initialization failure, the promise is reset to allow retry.

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Removed `semaphore-async-await` dependency
- Updated internal dependencies

## [6.0.36] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [6.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [6.0.34] - 2026-01-26

### 🔧 Chores

- Fixed repository URL in package.json from `furystack/core` to `furystack/furystack`

## [6.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [6.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system
