# Changelog

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
