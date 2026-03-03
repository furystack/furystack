# Changelog

## [8.1.0] - 2026-03-03

### 🐛 Bug Fixes

- `AbstractLogger.fatal()` now catches errors from `addEntry()` and logs them via `console.error` instead of letting them propagate — fatal log persistence failures no longer crash the caller

### 🧪 Tests

- Added test verifying `fatal()` does not throw when `addEntry()` fails

## [8.0.30] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated internal dependencies

## [8.0.29] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/*` dependencies

## [8.0.28] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [8.0.27] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [8.0.26] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Improved README with clearer examples and better structure

### 🔧 Chores

- Migrated to centralized changelog management system
