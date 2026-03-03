# Changelog

## [13.2.0] - 2026-03-03

### ✨ Features

### Lifecycle and error events via `EventHub`

`WebSocketApi` now extends `EventHub` and emits structured events:

- `onError` — emitted when action execution fails (`canExecute`, `getInstance`, or `execute`), or when a WebSocket error occurs
- `onClientConnected` — emitted when a client connects, with `{ ws, message }`
- `onClientDisconnected` — emitted when a client disconnects, with `{ ws }`

```typescript
webSocketApi.addListener('onError', ({ error, data, socket }) => {
  logger.error('WebSocket action error', { error })
})

webSocketApi.addListener('onClientConnected', ({ ws, message }) => {
  logger.info('Client connected')
})
```

### 🐛 Bug Fixes

- Action execution now properly waits for async `execute()` to complete before calling `Symbol.dispose` on the action — the previous `using()` pattern disposed immediately while execution was still running

### ♻️ Refactoring

- Action execution now uses explicit try/catch and `Promise.resolve().then()` instead of `using()`, ensuring errors are properly caught and emitted rather than silently dropped

### ⬆️ Dependencies

- Updated `@furystack/rest-service` with improved error handling for malformed requests

## [13.1.14] - 2026-02-27

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

## [13.1.13] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Updated `@furystack/rest-service` dependency to pick up the new `LoginResponseStrategy` abstraction
- Bumped due to updated workspace dependencies

## [13.1.12] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

## [13.1.11] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [13.1.10] - 2026-02-20

### ⬆️ Dependencies

- Updated `@furystack/repository` and `@furystack/rest-service` dependencies

## [13.1.9] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [13.1.8] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Updated `@furystack/rest-service` dependency
- Updated internal dependencies

## [13.1.7] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

### 🧪 Tests

- Refactored WebSocket integration tests to use `usingAsync` for proper `Injector` disposal

## [13.1.6] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [13.1.5] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors
- Updated `@furystack/rest-service` dependency

## [13.1.4] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system
