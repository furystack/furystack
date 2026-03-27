# Changelog

## [10.0.1] - 2026-03-27

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency

## [10.0.0] - 2026-03-27

### ✨ Features

- Normalized joystick callbacks to receive a single `event` object with a `data` payload (`onStart`, `onMove`, `onDir`, `onEnd`), aligning the component API with the current runtime event shape.

### 📚 Documentation

- Updated README examples and prop documentation to use the new callback signature and `NippleManagerOptions` type.

### 🧪 Tests

- Updated component tests to use the exported `NippleManagerEventHandler` type for callback mocks.

### ⬆️ Dependencies

- Upgraded `nipplejs` from `^0.10.2` to `^1.0.1` to use the latest upstream manager and event behavior.
- Updated `@furystack/shades` dependency

### 💥 Breaking Changes

### Callback Signatures Now Receive A Single Event Object

Joystick callback props no longer receive positional `(evt, data)` arguments.  
All callback props now receive a single `event` object, and joystick payload values are available under `event.data`.

**Before / After:**

```tsx
// ❌ Before
<NippleComponent
  managerOptions={{ mode: 'static', position: { left: '50%', top: '50%' } }}
  onMove={(_evt, data) => {
    console.log(data.direction?.angle)
    console.log(data.force)
  }}
/>

// ✅ After
<NippleComponent
  managerOptions={{ mode: 'static', position: { left: '50%', top: '50%' } }}
  onMove={(event) => {
    console.log(event.data.direction?.angle)
    console.log(event.data.force)
  }}
/>
```

**Impact:** Consumers using `onStart`, `onMove`, `onDir`, or `onEnd` with `(evt, data)` parameters must update handlers to use a single `event` parameter.

**Migration steps:**

1. Find all `NippleComponent` callback usages in your app.
2. Replace handler signatures from `(evt, data)` (or similar two-argument forms) to `(event)`.
3. Replace direct `data` references with `event.data`.
4. Run type-check and tests to verify all joystick interactions still compile and behave as expected.

## [9.0.3] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [9.0.2] - 2026-03-19

### ✨ Features

- Bumped `@furystack/shades` and `@furystack/core` dependencies.
- 9.0.0 breaking change: `shadowDomName` renamed to `customElementName` in `NippleComponent`.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [9.0.1] - 2026-03-10

### ⬆️ Dependencies

- Bumped `@furystack/shades` dependency
- Updated `@furystack/core` dependency to the new major version

## [9.0.0] - 2026-03-07

### ⬆️ Dependencies

- Updated internal FuryStack dependencies
- Updated `@furystack/shades` dependency

### 💥 Breaking Changes

### `shadowDomName` renamed to `customElementName` in Shade component API

The `NippleComponent` now uses `customElementName` instead of `shadowDomName`. This is a breaking change inherited from `@furystack/shades`.

### 📚 Documentation

- Updated README examples to use `customElementName`

## [8.0.11] - 2026-03-06

### 📦 Build

- Updated TypeScript project references

## [8.0.10] - 2026-03-05

### ⬆️ Dependencies

- Updated `@furystack/shades` peer dependency

## [8.0.9] - 2026-03-04

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency with nested router metadata support
- Updated `@furystack/shades` with ghost rendering race condition fix

## [8.0.8] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/shades` with updated `@furystack/utils` dependency
- Updated `@furystack/shades` with transitive dependency fixes

## [8.0.7] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped due to updated workspace dependencies

## [8.0.6] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency

## [8.0.5] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency

## [8.0.4] - 2026-02-22

### 🧪 Tests

- Updated test assertions to match synchronous render output from `@furystack/shades` reconciliation changes

### ⬆️ Dependencies

- Updated `@furystack/shades` peer dependency

## [8.0.3] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/shades` to pick up dependency tracking support in `useDisposable`

## [8.0.2] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/shades`

## [8.0.1] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated `@furystack/shades` dependency
- Updated internal dependencies
- Updated `@furystack/shades` with fix for `useState` setter disposal error

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
