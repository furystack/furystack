# Changelog

## [9.0.41] - 2026-02-26

### ♻️ Refactoring

- `GoogleLoginSettings` now uses `DataSet` and `SystemIdentityContext` instead of direct `PhysicalStore` access for user lookups

### 🧪 Tests

- Updated test setup to register DataSets for `User`, `DefaultSession`, `PasswordCredential`, and `PasswordResetToken`

### 📦 Dependencies

- Added `@furystack/repository` for repository layer enforcement

## [9.0.40] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [9.0.39] - 2026-02-20

### ⬆️ Dependencies

- Updated `@furystack/repository` and `@furystack/rest-service` dependencies

## [9.0.38] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [9.0.37] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Updated `@furystack/rest-service` dependency
- Updated internal dependencies

## [9.0.36] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [9.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [9.0.34] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors
- Updated `@furystack/rest-service` dependency

## [9.0.33] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Expanded README with detailed setup instructions and usage examples

### 🔧 Chores

- Migrated to centralized changelog management system
