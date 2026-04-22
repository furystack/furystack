# Changelog

## [8.1.8] - 2026-04-22

### ⬆️ Dependencies

- Updated `@furystack/rest` to the new major version (no API changes required in this package).

## [8.1.7] - 2026-04-17

### ⬆️ Dependencies

- Raised `path-to-regexp` to ^8.4.2 and dev `typescript` to ^6.0.3 and `vitest` to ^4.1.4.

## [8.1.6] - 2026-03-27

### ⬆️ Dependencies

- Updated `path-to-regexp` to ^8.4.0
- Updated `vitest` to ^4.1.2

## [8.1.5] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [8.1.4] - 2026-03-19

### ✨ Features

- Added `onResponseParseError` callback to `ClientOptions` to surface JSON parse failures.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [8.1.3] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [8.1.2] - 2026-03-07

### ⬆️ Dependencies

- Updated internal FuryStack dependencies
- Updated `@furystack/rest` dependency to pick up the new OpenAPI bidirectional support and renamed types (`OpenApiDocument`, `WithSchemaAction` with `/openapi.json`)

## [8.1.1] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [8.1.0] - 2026-03-03

### ✨ Features

### `onResponseParseError` callback in `ClientOptions`

`createClient` now accepts an `onResponseParseError` option, called when `response.json()` fails during response parsing. This surfaces JSON parse errors that were previously silent (the default behavior of returning `null` is unchanged).

```typescript
const client = createClient<MyApi>({
  endpointUrl: 'https://api.example.com',
  onResponseParseError: ({ response, error }) => {
    console.error(`Failed to parse response from ${response.url}:`, error)
  },
})
```

### 🧪 Tests

- Added tests for `onResponseParseError` callback invocation on JSON parse failure

### ⬆️ Dependencies

- Updated `@furystack/rest` with improved error handling for malformed query parameters

## [8.0.40] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped due to updated workspace dependencies

## [8.0.39] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/rest` dependency

## [8.0.38] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [8.0.37] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/rest`

## [8.0.36] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated internal dependencies

## [8.0.35] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/rest` dependency
- Updated `@furystack/*` dependencies

## [8.0.34] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [8.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [8.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Expanded README with detailed usage examples and API documentation

### 🔧 Chores

- Migrated to centralized changelog management system
