# Changelog

## [7.0.6] - 2026-03-19

### ✨ Features

- Updated `@furystack/core` dependency to the latest major version.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [7.0.5] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [7.0.4] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`

## [7.0.3] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [7.0.2] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/utils` with EventHub listener error handling

## [7.0.1] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped `@types/node` from ^25.3.0 to ^25.3.1

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
