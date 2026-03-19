# Changelog

## [3.0.2] - 2026-03-19

### ✨ Features

- 3.0.1 patch: bumped `@furystack/shades` and `@furystack/core` dependencies.
- 3.0.0 breaking change: Shade API rename `shadowDomName` → `customElementName`.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [3.0.1] - 2026-03-10

### ⬆️ Dependencies

- Bumped `@furystack/shades` dependency
- Updated `@furystack/core` dependency to the new major version

## [3.0.0] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`
- Updated `@furystack/shades` dependency

### 💥 Breaking Changes

### `shadowDomName` renamed to `customElementName` in Shade component API

The `MicroFrontend` component and all Shade components created with `createShadesMicroFrontend()` now use `customElementName` instead of `shadowDomName`. This is a breaking change inherited from `@furystack/shades`.

**Examples:**

```typescript
// ❌ Before
const MyMfeComponent = Shade<MyMfeApi>({
  shadowDomName: 'my-mfe-component',
  render: ({ props }) => <div>{props.greeting}</div>,
})

// ✅ After
const MyMfeComponent = Shade<MyMfeApi>({
  customElementName: 'my-mfe-component',
  render: ({ props }) => <div>{props.greeting}</div>,
})
```

### 📚 Documentation

- Updated README examples to use `customElementName`

### 🧪 Tests

- Updated all test cases to use the new `customElementName` property

## [2.0.11] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [2.0.10] - 2026-03-05

### ⬆️ Dependencies

- Updated `@furystack/shades` peer dependency

## [2.0.9] - 2026-03-04

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency with nested router metadata support
- Updated `@furystack/shades` with ghost rendering race condition fix

## [2.0.8] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/shades` with updated `@furystack/utils` dependency
- Updated `@furystack/shades` with transitive dependency fixes

## [2.0.7] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [2.0.6] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency

## [2.0.5] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency

## [2.0.4] - 2026-02-22

### 🧪 Tests

- Replaced `sleepAsync()` with `flushUpdates()` across micro-frontend component tests for deterministic, timing-independent assertions

### ⬆️ Dependencies

- Updated `@furystack/shades` peer dependency

## [2.0.3] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/shades` to pick up dependency tracking support in `useDisposable`

## [2.0.2] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/shades`

## [2.0.1] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Updated `@furystack/shades` dependency
- Updated internal dependencies
- Updated `@furystack/shades` with fix for `useState` setter disposal error

## [2.0.0] - 2026-02-09

### ⬆️ Dependencies

- Updated peer dependency `@furystack/shades` to latest minor version
- Peer dependency on `@furystack/shades` bumped to new major version
- Updated `@furystack/shades` dependency

### 💥 Breaking Changes

### Requires `@furystack/shades` v3

This package now depends on the new major version of `@furystack/shades` which removed the `constructed` callback.

### Migrated from `element` to `useRef` for Container Management

The `MicroFrontend` component no longer uses the `element` render option to access the host element. Instead, it uses `useRef` to create a container `<div>` inside the component, and the micro-frontend is mounted into that container.

**Impact:** The internal mounting behavior has changed — micro-frontends are now mounted inside a child `<div>` rather than directly into the host custom element. This should be transparent for most consumers, but any code that relies on the MFE being a direct child of the `shade-micro-frontend` element may need adjustment.

### ♻️ Refactoring

- Migrated `MicroFrontend` component from async `constructed` callback to `useDisposable()` in `render`, using `[Symbol.asyncDispose]` for cleanup
- Replaced `element` parameter with `useRef('mfeContainer')` and a container `<div>` for MFE mounting
- MFE loader now defers initialization via `queueMicrotask` to ensure the ref is available after the first render
- Added prop propagation to inner MFE elements for Shade-based micro-frontends

### 🧪 Tests

- Updated micro-frontend tests to work with microtask-based rendering
- Refactored `createShadesMicroFrontend` and `MicroFrontend` tests to use `usingAsync` for proper `Injector` disposal
- Updated tests to accommodate new rendering flow

## [1.0.28] - 2026-02-01

### ⬆️ Dependencies

- Updated peer dependency `@furystack/shades` to include new CSS styling features

## [1.0.27] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [1.0.26] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [1.0.25] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Expanded README with detailed micro-frontend setup and configuration examples

### 🔧 Chores

- Migrated to centralized changelog management system
