# Changelog

## [8.0.1] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated `@furystack/shades` dependency
- Updated internal dependencies
- Updated `@furystack/shades` with fix for `useState` setter disposal error

## [8.0.0] - 2026-02-09

### ⬆️ Dependencies

- Updated peer dependency `@furystack/shades` to latest minor version
- Updated peer dependency `@furystack/shades` to new major version
- Updated `@furystack/shades` dependency with microtask-based batched rendering
- Updated `@furystack/*` dependencies
- Peer dependency on `@furystack/shades` bumped to new major version
- Updated `@furystack/shades` dependency

### 💥 Breaking Changes

### Requires `@furystack/shades` v3

This package now depends on the new major version of `@furystack/shades` which removed the `constructed` callback from the Shade API.

### Peer Dependency Bump

Updated peer dependency on `@furystack/shades` to the new major version with VNode-based rendering. No API changes in this package.

## [7.0.36] - 2026-02-01

### ⬆️ Dependencies

- Updated peer dependency `@furystack/shades` to include new CSS styling features

## [7.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [7.0.34] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [7.0.33] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Added detailed README with component documentation and usage examples

### 🔧 Chores

- Migrated to centralized changelog management system
