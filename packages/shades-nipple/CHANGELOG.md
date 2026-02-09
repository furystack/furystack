# Changelog

## [8.0.0] - 2026-02-09

### ⬆️ Dependencies

- Updated peer dependency `@furystack/shades` to latest minor version
- Updated `@furystack/shades` dependency with microtask-based batched rendering
- Peer dependency on `@furystack/shades` bumped to new major version
- Updated `@furystack/shades` dependency

### 💥 Breaking Changes

### Requires `@furystack/shades` v3

This package now depends on the new major version of `@furystack/shades` which removed the `constructed` callback.

### Migrated from `element` to `useRef` for Zone Management

The `NippleComponent` no longer uses the `element` render option as the nipplejs zone. Instead, it uses `useRef` to reference a dedicated container `<div>`, which is passed to `nipplejs.create()` as the zone.

**Impact:** The nipplejs manager is now attached to a child `<div>` inside the component rather than the host custom element itself. This should be transparent for most consumers.

### ♻️ Refactoring

- Migrated `NippleComponent` from async `constructed` callback to `useDisposable()` in `render` for nipplejs manager initialization and cleanup
- Replaced `element` parameter with `useRef('zone')` and a container `<div>` for nipplejs initialization
- Nipple manager creation now deferred via `queueMicrotask` to ensure the ref is available after the first render

### 🧪 Tests

- Refactored `Nipple` component tests to use `usingAsync` for proper `Injector` disposal

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
