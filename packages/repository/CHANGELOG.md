# Changelog

## [10.1.0] - 2026-02-20

### ✨ Features

### Bulk Remove in DataSet

`DataSet.remove()` now accepts multiple primary keys via rest parameters, allowing removal of several entities in a single call. Authorization checks run against all entities before any are deleted (all-or-nothing), and an `onEntityRemoved` event is emitted for each removed entity.

**Usage:**

```typescript
// Before - remove one at a time
await dataSet.remove(injector, key1)
await dataSet.remove(injector, key2)

// After - remove multiple at once
await dataSet.remove(injector, key1, key2, key3)
```

### 🐛 Bug Fixes

- Fixed `DataSet.get()` to fetch the full entity before running `authorizeGetEntity`, then applying field selection afterward. Previously, the entity passed to the authorization callback could have missing fields when `select` was provided.

### ♻️ Refactoring

- `DataSet.get()` return type is now properly generic as `PartialResult<T, TSelect>`, improving type inference for callers that pass a `select` parameter

### 🧪 Tests

- Added tests for bulk removal: removing multiple entities, event emission per key, per-entity authorization, and all-or-nothing rollback when authorization fails

## [10.0.37] - 2026-02-19

### 📚 Documentation

- Expanded JSDoc on `DataSet` class to explain its role as the authorized write gateway with event dispatching
- Expanded JSDoc on `add()`, `update()`, and `remove()` to document authorization checks, hooks, and emitted events
- Expanded JSDoc on `getDataSetFor()` with usage examples for server-side writes using `useSystemIdentityContext`
- Added README section covering server-side writes with the elevated `IdentityContext`, including a warning about bypassing the DataSet layer

### ⬆️ Dependencies

- Updated `@furystack/core`

## [10.0.36] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated internal dependencies

## [10.0.35] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [10.0.34] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [10.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [10.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Improved README with clearer examples and better structure

### 🔧 Chores

- Migrated to centralized changelog management system
