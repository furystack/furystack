# Changelog

## [15.0.35] - 2026-02-09

### 🐛 Bug Fixes

- Fixed `getPort()` to assign deterministic port ranges per Vitest worker using `VITEST_POOL_ID` instead of a random base port, preventing port collisions in parallel test runs

### 🧪 Tests

- Refactored `globalDisposable` tests to use `usingAsync` for proper `Injector` disposal

## [15.0.34] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [15.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [15.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Improved README with clearer examples and better structure

### 🐛 Bug Fixes

- Fixed `getPort()` returning duplicate ports by reusing a shared generator instance instead of creating a new one on each call

### 🔧 Chores

- Migrated to centralized changelog management system
