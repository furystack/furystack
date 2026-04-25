# Changelog

## [11.0.0] - 2026-04-25

### 💥 Breaking Changes

- Version bumped to align with the monorepo-wide functional DI migration. No DI surface in this package; built cleanly against the new `@furystack/shades` exports. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale and patterns.

## [10.0.0] - 2026-04-22

### 💥 Breaking Changes

### Bumped peer dependency on `@furystack/shades`

This release aligns with the `@furystack/shades` major release that renamed `NestedRouteLink`'s `href` prop to `path` and switched `nestedNavigate` to an object-arg signature. No source changes were required in this package, but consumers that also use `@furystack/shades` routing APIs need to migrate those call sites — see the `@furystack/shades` changelog for details.

**Impact:** Consumers upgrading to the new `@furystack/shades` major must also update any `NestedRouteLink` / `nestedNavigate` call sites in their own code.

## [9.0.6] - 2026-04-17

### ⬆️ Dependencies

- Raised `typescript` to ^6.0.3 and `vitest` to ^4.1.4 so package builds and tests track the workspace toolchain.

## [9.0.5] - 2026-03-27

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency

## [9.0.4] - 2026-03-27

### ⬆️ Dependencies

- Updated `@furystack/shades` dependency

## [9.0.3] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [9.0.2] - 2026-03-19

### ✨ Features

- Bumped `@furystack/shades` and `@furystack/core` dependencies.
- 9.0.0 breaking change: `shadowDomName` renamed to `customElementName`.

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

Shade components that use the Lottie player now require `customElementName` instead of `shadowDomName`. This is a breaking change inherited from `@furystack/shades`.

### 📚 Documentation

- Updated README examples to use `customElementName`

## [8.0.11] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

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
