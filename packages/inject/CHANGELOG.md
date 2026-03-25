# Changelog

## [12.0.34] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [12.0.33] - 2026-03-19

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [12.0.32] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [12.0.31] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/utils` with EventHub listener error handling

## [12.0.30] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated internal dependencies

## [12.0.29] - 2026-02-09

### 🧪 Tests

- Refactored `Injected` and `Injector` tests to use `usingAsync` for proper `Injector` disposal

## [12.0.28] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [12.0.27] - 2026-01-26

### 🐛 Bug Fixes

### Fixed singleton injector reference being overwritten by child injectors

The `getInstance()` method was unconditionally overwriting the injector reference on returned instances, even for singletons retrieved from a parent injector. This caused singletons to incorrectly reference the child injector that last retrieved them instead of the parent injector that created/owns them.

**Before:** When a child injector retrieved a singleton from a parent, the singleton's `injector` property was overwritten to point to the child.

**After:** The injector reference is now set at instance creation time and preserved when retrieved from parent injectors.

### 🧪 Tests

- Added regression tests to verify singleton injector references are preserved when retrieved from child injectors

## [12.0.26] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Improved README with clearer examples and better structure

### 🔧 Chores

- Migrated to centralized changelog management system
