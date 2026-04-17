# Changelog

## [8.1.5] - 2026-04-17

### ⬆️ Dependencies

- Raised `typescript` to ^6.0.3 and `vitest` to ^4.1.4 so package builds and tests track the workspace toolchain.

## [8.1.4] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [8.1.3] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [8.1.2] - 2026-03-19

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [8.1.1] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

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
