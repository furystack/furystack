# Changelog

## [11.0.7] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [11.0.6] - 2026-02-20

### ♻️ Refactoring

- Removed `any` type assertion in `createGetCollectionEndpoint`, relying on proper type inference from `DataSet.find()` instead

## [11.0.5] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core` and `@furystack/repository`

## [11.0.4] - 2026-02-11

### 🐛 Bug Fixes

- Preserve original error cause in `PathProcessor.validateUrl()` using `{ cause: error }` for better error traceability

### ♻️ Refactoring

- Replaced semaphore-based server creation lock with a `pendingCreates` Map for deduplicating concurrent `getOrCreate()` calls. In-flight server creation promises are now reused instead of serialized behind a semaphore.
- Simplified `[Symbol.asyncDispose]()` — disposal now awaits pending server creations directly instead of waiting on a semaphore lock with a timeout.

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Removed `semaphore-async-await` dependency
- Updated internal dependencies

## [11.0.3] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [11.0.2] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [11.0.1] - 2026-01-26

### 🐛 Bug Fixes

- Added `owner` parameter when creating child injectors for API request handling, improving debuggability and traceability of injector hierarchies

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [11.0.0] - 2026-01-22

### 💥 Breaking Changes

### ApiEndpointSchema structure changed

The `ApiEndpointSchema` generic type now requires endpoints to be grouped by HTTP method.

**Before:**

```json
{
    "name": "My Endpoint",
    "description": "My Endpoint Description",
    "version": "5.2.1",
    "endpoints": {
        "/entity": {...}
    }
}
```

**After:**

```json
{
    "name": "My Endpoint",
    "description": "My Endpoint Description",
    "version": "5.2.1",
    "endpoints": {
        "GET": {
            "/entity": {...}
        },
        "POST": {
            "/entity": {...}
        }
    }
}
```

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system
