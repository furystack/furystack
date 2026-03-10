# Changelog

## [3.0.1] - 2026-03-10

### ⬆️ Dependencies

- Bumped `@furystack/shades` dependency
- Updated `@furystack/core` dependency to the new major version

## [3.0.0] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`
- Updated `@furystack/shades` dependency

### 💥 Breaking Changes

### `createI18nComponent` option `shadowDomName` renamed to `customElementName`

The `createI18nComponent()` function now accepts `customElementName` instead of `shadowDomName` in its options object.

**Examples:**

```typescript
// ❌ Before
const I18n = createI18nComponent({
  service,
  shadowDomName: 'i18n-translated',
})

// ✅ After
const I18n = createI18nComponent({
  service,
  customElementName: 'i18n-translated',
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

- Updated `@furystack/utils` with EventHub listener error handling
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

- Replaced `sleepAsync()` with `flushUpdates()` across all i18n component tests for deterministic, timing-independent assertions

### ⬆️ Dependencies

- Updated `@furystack/shades` peer dependency

## [2.0.3] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/shades` to pick up dependency tracking support in `useDisposable`

## [2.0.2] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/i18n` and `@furystack/shades`

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

### 🔧 Chores

- Migrated to centralized changelog management system
