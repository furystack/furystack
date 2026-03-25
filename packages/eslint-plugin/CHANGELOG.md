# Changelog

## [2.1.3] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1
- Upgraded `@typescript-eslint/utils` from ^8.57.1 to ^8.57.2
- Upgraded `@typescript-eslint/rule-tester` from ^8.57.1 to ^8.57.2

## [2.1.2] - 2026-03-19

### ✨ Features

- Version bump and existing rule enhancements.

### 🐛 Bug Fixes

- Replaced `TSESLint.FlatConfig.Config` with native `Linter.Config` from `eslint` in `recommended` and `shades` configs to fix type compatibility with `eslint/config`.
- Added type assertion on the default plugin export to work around a typescript-eslint typing issue that prevented proper inference.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [2.1.1] - 2026-03-11

### 🐛 Bug Fixes

- Replaced `TSESLint.FlatConfig.Config` with native `Linter.Config` from `eslint` for config type definitions in `recommended` and `shades` configs, fixing type compatibility issues with `eslint/config`'s `defineConfig()`
- Added type assertion on the default plugin export to work around a [typescript-eslint typing issue](https://github.com/typescript-eslint/typescript-eslint/issues/11543) that prevented proper type inference when using the plugin

## [2.1.0] - 2026-03-10

### ✨ Features

- Added `require-tabindex-with-spatial-nav-target` rule — reports elements with `data-spatial-nav-target` that are missing `tabIndex`, which is required for `SpatialNavigationService` to focus them. Supports JSX attributes and `useHostProps()` calls (including spread and conditional patterns). Natively focusable elements (`button`, `input`, `select`, `textarea`, `a`) are excluded.
- Added `require-tabindex-with-spatial-nav-target` to the `shades` (warn) and `shadesStrict` (error) preset configs

### 🧪 Tests

- Added tests for `require-tabindex-with-spatial-nav-target` covering JSX elements, `useHostProps()` calls, natively focusable elements, spread patterns, and conditional expressions

## [2.0.0] - 2026-03-07

### 💥 Breaking Changes

### Renamed `valid-shadow-dom-name` rule to `valid-custom-element-name`

The ESLint rule `furystack/valid-shadow-dom-name` has been removed and replaced by `furystack/valid-custom-element-name`. If you reference `furystack/valid-shadow-dom-name` in your ESLint config, replace it with `furystack/valid-custom-element-name`. Both the `shades` and `shadesStrict` configs have been updated to use the new rule name.

### ✨ Features

### `no-removed-shade-apis` rule now detects `shadowDomName` usage

The `no-removed-shade-apis` rule now reports `shadowDomName` in `Shade()` options as a removed API and provides an auto-fix to rename it to `customElementName`.

## [1.0.0] - 2026-03-06

### 💥 Breaking Changes

### Initial Major Release

This is the first stable release of `@furystack/eslint-plugin`. As a new package, there are no migrations required from a previous version.

**Peer dependency:** Requires ESLint >= 9.0.0 (flat config).

### ✨ Features

### New ESLint Plugin for FuryStack and Shades

A dedicated ESLint plugin with custom rules that enforce FuryStack patterns and catch common pitfalls at lint time. Built with `@typescript-eslint/utils` and compatible with ESLint 9 flat config.

**Rules included:**

#### General FuryStack Rules

- `no-direct-physical-store` - Prevents direct `StoreManager.getStoreFor()` usage in application code, enforcing `getDataSetFor()` from `@furystack/repository` to ensure authorization, modification hooks, and entity sync events are not bypassed
- `require-disposable-for-observable-owner` - Requires classes that own `ObservableValue` instances to implement `Disposable` with a `[Symbol.dispose]()` method. Provides **auto-fix** that generates the dispose method with all necessary disposal calls
- `require-observable-disposal` - Ensures every `ObservableValue` field in a class is disposed in the `[Symbol.dispose]()` method to prevent memory leaks. Provides **auto-fix** that appends missing disposal calls
- `prefer-using-wrapper` - Suggests `using()` / `usingAsync()` wrappers over manual create-and-dispose patterns in the same scope, ensuring disposal even if an exception is thrown
- `injectable-consistent-inject` - Ensures `@Injected()` decorated properties use the `declare` keyword and that the type annotation matches the constructor argument

#### Shades-specific Rules

- `no-module-level-jsx` - Prevents JSX stored in module-level variable declarations, which creates shared VNode instances that cause duplication bugs on re-render
- `no-removed-shade-apis` - Prevents usage of removed Shade APIs (`onAttach`, `onDetach`, `element` in render), guiding toward `useDisposable()`, `useHostProps()`, and `useRef()`
- `valid-shadow-dom-name` - Validates `shadowDomName` strings conform to the Custom Elements spec (lowercase, contains hyphen, valid start character). Provides **auto-fix** for casing issues
- `no-css-state-hooks` - Warns against using `useState` for CSS-representable states (hover, focus, active, pressed), suggesting CSS pseudo-selectors instead
- `prefer-use-state` - Suggests `useState()` over manual `useDisposable(ObservableValue)` + `useObservable` for local component state
- `no-direct-get-value-in-render` - Warns when `.getValue()` is called inside a Shade render return expression without a corresponding `useObservable` subscription
- `no-manual-subscribe-in-render` - Disallows calling `.subscribe()` directly inside a Shade render function without wrapping it in `useDisposable`
- `require-use-observable-for-render` - Requires a matching `useObservable` call when `useDisposable` creates an `ObservableValue` and `.getValue()` is used in the render output
- `prefer-location-service` - Prevents direct `history.pushState`/`replaceState` calls, enforcing `LocationService.navigate()` or `NestedRouteLink` for SPA navigation
- `prefer-nested-route-link` - Suggests `<NestedRouteLink>` over `<a href="/...">` for in-app navigation inside Shade components

#### REST Rules

- `rest-action-use-request-error` - Enforces using `RequestError` instead of `Error` for thrown exceptions in REST action files, ensuring proper HTTP status codes
- `rest-action-validate-wrapper` - Enforces that REST endpoint registrations in `useRestService()` API definitions are wrapped with `Validate()` for request validation

**Preset Configurations:**

- `recommended` / `recommendedStrict` - General FuryStack rules with warn/error severity
- `shades` / `shadesStrict` - Shades-specific rules with warn/error severity

**Usage:**

```typescript
import furystack from '@furystack/eslint-plugin'

export default [
  {
    plugins: { furystack },
    ...furystack.configs.recommendedStrict,
  },
  {
    files: ['packages/shades/**/*.{ts,tsx}'],
    ...furystack.configs.shadesStrict,
  },
]
```

### 🧪 Tests

- Added rule tests for all 17 rules using `@typescript-eslint/rule-tester` with Vitest integration, covering valid patterns, invalid patterns, error messages, and auto-fix output

### 📦 Build

- Configured TypeScript project with composite references
- Added Vitest test configuration
