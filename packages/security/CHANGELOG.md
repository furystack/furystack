# Changelog

## [7.0.0] - 2026-02-26

### 💥 Breaking Changes

- `PasswordAuthenticator` now operates through the Repository DataSet layer instead of direct `PhysicalStore` access, ensuring authorization hooks and entity-sync events are triggered for credential and reset-token mutations
- Requires DataSets for `PasswordCredential` and `PasswordResetToken` to be registered via `getRepository(injector).createDataSet()` before instantiating `PasswordAuthenticator`

### 🔄 Migration

**Before:**

```typescript
addStore(injector, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' }))
usePasswordPolicy(injector)
```

**After:**

```typescript
addStore(injector, new InMemoryStore({ model: PasswordCredential, primaryKey: 'userName' })).addStore(
  new InMemoryStore({ model: PasswordResetToken, primaryKey: 'token' }),
)
getRepository(injector).createDataSet(PasswordCredential, 'userName')
getRepository(injector).createDataSet(PasswordResetToken, 'token')
usePasswordPolicy(injector)
```

### 📦 Dependencies

- Added `@furystack/repository` for repository layer enforcement

## [6.0.38] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [6.0.37] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [6.0.36] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Updated internal dependencies

## [6.0.35] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [6.0.34] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [6.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [6.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Improved README with clearer examples and better structure

### 🔧 Chores

- Migrated to centralized changelog management system
