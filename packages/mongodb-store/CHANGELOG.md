# Changelog

## [10.1.3] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [10.1.2] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`

## [10.1.1] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [10.1.0] - 2026-03-03

### ✨ Features

### Lifecycle events in `MongoClientFactory`

`MongoClientFactory` now extends `EventHub` and emits events for client lifecycle:

- `onClientCreated` — emitted when a new MongoDB client is created, with `{ url }`
- `onDisposed` — emitted when the factory is disposed

```typescript
const factory = injector.getInstance(MongoClientFactory)

factory.addListener('onClientCreated', ({ url }) => {
  console.log(`MongoDB client created for ${url}`)
})
```

### 🧪 Tests

- Added tests for `onClientCreated` event emission on new client creation
- Added test verifying `onClientCreated` is not emitted when returning a cached client

## [10.0.41] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [10.0.40] - 2026-02-26

### 📝 Documentation

- Added tip about wrapping the physical store with a Repository DataSet for application-level data access

## [10.0.39] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [10.0.38] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [10.0.37] - 2026-02-11

### ♻️ Refactoring

- Replaced semaphore-based initialization lock with promise deduplication for MongoDB collection setup. Concurrent calls to `getCollection()` now reuse a single in-flight initialization promise instead of queuing behind a semaphore. On initialization failure, the promise is reset to allow retry.

### ⬆️ Dependencies

- Bump `mongodb` from `7.0.0` to `7.1.0`
- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Removed `semaphore-async-await` dependency
- Updated internal dependencies

## [10.0.36] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [10.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [10.0.34] - 2026-01-26

### 🔧 Chores

- Fixed repository URL in package.json from `furystack/core` to `furystack/furystack`

## [10.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [10.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system
