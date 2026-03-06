<!-- version-type: major -->

# @furystack/eslint-plugin

## 💥 Breaking Changes

### Initial Major Release

This is the first stable release of `@furystack/eslint-plugin`. As a new package, there are no migrations required from a previous version.

**Peer dependency:** Requires ESLint >= 9.0.0 (flat config).

## ✨ Features

### New ESLint Plugin for FuryStack and Shades

A dedicated ESLint plugin with custom rules that enforce FuryStack patterns and catch common pitfalls at lint time. Built with `@typescript-eslint/utils` and compatible with ESLint 9 flat config.

**Rules included:**

#### General FuryStack Rules

- `no-direct-physical-store` - Prevents direct `StoreManager.getStoreFor()` usage in application code, enforcing `getDataSetFor()` from `@furystack/repository` to ensure authorization, modification hooks, and entity sync events are not bypassed
- `require-disposable-for-observable-owner` - Requires classes that own `ObservableValue` instances to implement `Disposable` with a `[Symbol.dispose]()` method. Provides **auto-fix** that generates the dispose method with all necessary disposal calls
- `require-observable-disposal` - Ensures every `ObservableValue` field in a class is disposed in the `[Symbol.dispose]()` method to prevent memory leaks. Provides **auto-fix** that appends missing disposal calls
- `prefer-using-wrapper` - Suggests `using()` / `usingAsync()` wrappers over manual create-and-dispose patterns in the same scope, ensuring disposal even if an exception is thrown
- `prefer-use-state` - Suggests `useState()` over manual `useDisposable(ObservableValue)` + `useObservable` for local component state

#### Shades-specific Rules

- `no-module-level-jsx` - Prevents JSX stored in module-level variable declarations, which creates shared VNode instances that cause duplication bugs on re-render
- `no-removed-shade-apis` - Prevents usage of removed Shade APIs (`onAttach`, `onDetach`, `element` in render), guiding toward `useDisposable()`, `useHostProps()`, and `useRef()`
- `valid-shadow-dom-name` - Validates `shadowDomName` strings conform to the Custom Elements spec (lowercase, contains hyphen, valid start character). Provides **auto-fix** for casing issues
- `no-css-state-hooks` - Warns against using `useState` for CSS-representable states (hover, focus, active, pressed), suggesting CSS pseudo-selectors instead

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

## 🧪 Tests

- Added rule tests for all 9 rules using `@typescript-eslint/rule-tester` with Vitest integration, covering valid patterns, invalid patterns, error messages, and auto-fix output

## 📦 Build

- Configured TypeScript project with composite references
- Added Vitest test configuration
