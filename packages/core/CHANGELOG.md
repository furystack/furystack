# Changelog

## [16.0.0] - 2026-03-10

### 💥 Breaking Changes

### IdentityContext lifetime changed from `scoped` to `explicit`

`IdentityContext` now uses `@Injectable({ lifetime: 'explicit' })` instead of `@Injectable({ lifetime: 'scoped' })`.

**Why:** With `scoped` lifetime, child injectors created via `createChild()` could not inherit the `IdentityContext` from their parent. Each child silently created a new default instance whose methods returned `false` or threw `"No IdentityContext"`. This was a common source of confusion, especially in Shades frontend applications where nested component injectors should share the same identity.

With `explicit` lifetime, `getInstance(IdentityContext)` walks up the parent injector chain, so you only need to set it once on the root (or request-scoped) injector and all descendants will find it.

**Who is affected:** Code that called `injector.getInstance(IdentityContext)` without a prior `setExplicitInstance` call. Previously this returned a useless default instance; now it throws `CannotInstantiateExplicitLifetimeError`.

**Who is NOT affected:** All standard FuryStack server-side setups (`useHttpAuthentication`, `useJwtAuthentication`, `useSystemIdentityContext`, REST/WebSocket API managers) already call `setExplicitInstance` before accessing `IdentityContext` and will continue to work without changes.

**Migration:**

```typescript
// ❌ Before (scoped) — silently returned a broken default
const ctx = injector.getInstance(IdentityContext)

// ✅ After (explicit) — set it before accessing
injector.setExplicitInstance(myIdentityContext, IdentityContext)
const ctx = injector.getInstance(IdentityContext) // works

// ✅ Child injectors now inherit automatically
const child = injector.createChild()
const ctx = child.getInstance(IdentityContext) // same instance from parent
```

### 📚 Documentation

- Updated `IdentityContext` JSDoc to reflect the `explicit` lifetime, including setup instructions and parent inheritance behavior

## [15.2.5] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`

## [15.2.4] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [15.2.3] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/utils` with EventHub listener error handling and ObservableValue `onError` support

## [15.2.2] - 2026-02-26

### 🔧 Chores

- Normalized line endings in `store-manager.ts`

### ⬆️ Dependencies

- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [15.2.1] - 2026-02-26

### 📝 Documentation

- Added JSDoc recommendations to `PhysicalStore` and `StoreManager.getStoreFor()` pointing to `DataSet` as the preferred write gateway for application-level code

## [15.2.0] - 2026-02-22

### ✨ Features

### Public `filterItems()` function

Extracted the filter logic from `InMemoryStore` into a standalone `filterItems()` function, now exported from `@furystack/core`. This allows consumers to filter arrays using `FilterType` expressions without needing a store instance.

**Usage:**

```typescript
import { filterItems } from '@furystack/core'

const results = filterItems(myArray, {
  name: { $startsWith: 'foo' },
  age: { $gte: 18 },
})
```

### ♻️ Refactoring

- `InMemoryStore` now delegates to the public `filterItems()` function internally instead of using a private method

## [15.1.0] - 2026-02-19

### ✨ Features

### `SystemIdentityContext` -- elevated identity for trusted server-side operations

Added `SystemIdentityContext`, an `IdentityContext` subclass that is always authenticated and authorized. It is intended for background jobs, migrations, and seed scripts that need to write through the `DataSet` layer without an HTTP user session.

Also added the `useSystemIdentityContext()` helper that creates a scoped child injector with the elevated context. The returned injector is `AsyncDisposable` and works with `usingAsync()` for automatic cleanup.

**Usage:**

```typescript
import { useSystemIdentityContext } from '@furystack/core'
import { getDataSetFor } from '@furystack/repository'
import { usingAsync } from '@furystack/utils'

await usingAsync(useSystemIdentityContext({ injector, username: 'migration-job' }), async (systemInjector) => {
  const dataSet = getDataSetFor(systemInjector, MyModel, 'id')
  await dataSet.add(systemInjector, newEntity)
})
```

### 📚 Documentation

- Expanded JSDoc on `PhysicalStore` to warn that writing directly to the store bypasses DataSet authorization, hooks, and events

### 🧪 Tests

- Added tests for `SystemIdentityContext` (authentication, authorization, custom username)
- Added tests for `useSystemIdentityContext` (child injector scoping, disposal, identity resolution)

### ⬆️ Dependencies

- Updated `@furystack/inject` and `@furystack/utils`

## [15.0.36] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Updated internal dependencies

## [15.0.35] - 2026-02-09

### 🐛 Bug Fixes

- Fixed `getPort()` to assign deterministic port ranges per Vitest worker using `VITEST_POOL_ID` instead of a random base port, preventing port collisions in parallel test runs

### 🧪 Tests

- Refactored `globalDisposable` tests to use `usingAsync` for proper `Injector` disposal

## [15.0.34] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [15.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [15.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Improved README with clearer examples and better structure

### 🐛 Bug Fixes

- Fixed `getPort()` returning duplicate ports by reusing a shared generator instance instead of creating a new one on each call

### 🔧 Chores

- Migrated to centralized changelog management system
