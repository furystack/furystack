# Changelog

## [14.1.0] - 2026-05-21

### 📚 Documentation

- Rewrote JSDoc on `WebSocketApi`, the action models, and the built-in `whoami` action to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints around connection lifecycle and message dispatch.

### ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.
- Imports `IdentityEventBus`, `HttpAuthenticationSettings`, and `extractSessionIdFromCookies` from `@furystack/rest-service` (already a peer; no new packages introduced).
- Bumped the transitive `@furystack/cache` dependency (via `@furystack/rest-service`) to its new major version. No source changes were required in this package.
- Bumped `ws` from `^8.20.0` to `^8.20.1` (runtime dependency).
- Bumped `vitest` to `^4.1.7`. Dev-tooling only.

### ✨ Features

### WebSocket connections close on cross-node logout

`useWebSocketApi` now subscribes to `IdentityEventBus`. When a `userLoggedOut` event fires — locally or from a sibling node via the bus — every WebSocket whose connect-time cookie carries the invalidated session id is closed with code `1008` ("Session invalidated").

```typescript
import { useWebSocketApi } from '@furystack/websocket-api'

await useWebSocketApi({ injector, port: 8080 })

const userContext = injector.get(HttpUserContext)
await userContext.cookieLogout(request, response)
// → publishes `userLoggedOut` on the bus
// → every node closes the affected sockets
```

This ties WebSocket lifecycle to identity invalidation across a horizontally-scaled deployment. Apps that have not bound a transport adapter run against the in-process default `CrossNodeBus` and only see the local effect — but the API surface is unchanged.

### 🐛 Bug Fixes

- WebSockets opened on the same node that processed a logout are now closed too. Previously the originating node only invalidated the identity cache; long-lived sockets stayed open until the client noticed.

### 🔧 Chores

- Updated the websocket integration test that exercises mid-session role updates to invalidate the new `UserResolutionCache` after mutating the user record. Documents the recommended pattern for apps that mutate user state out-of-band: call `injector.get(UserResolutionCache).invalidate(...)` (or `invalidateAll()`) after the change so the next websocket message picks up the new identity instead of waiting for the cache TTL to elapse.

## [14.0.0] - 2026-04-25

### 💥 Breaking Changes

Class-based WebSocket actions are gone — use plain-object action descriptors. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed the `WebSocketApiSettings` token. Settings are now inline on `useWebSocketApi({ injector, port, hostName?, path?, actions? })`.
- Removed the class-based `WebSocketAction` contract (`@Injectable`, static `canExecute`, `@Injected` deps). `WebSocketAction` is now `{ canExecute(ctx): boolean; execute(ctx & { injector }): Promise<void> }`. Dependencies are resolved from `context.injector` (a per-message scope) on demand.
- Renamed `useWebsockets(injector, opts)` → `useWebSocketApi({ injector, ... })`. The returned handle exposes `subscribe` / `emit` for `onConnect` / `onDisconnect`, a `broadcast(cb)` helper, and the underlying `socket` / `serverApi` references. Multiple endpoints on one injector are now supported.
- Action failures route to `ServerTelemetryToken#onWebSocketActionFailed` (new event) instead of the deleted `WebSocketApi` class events.
- Each message gets a fresh injector scope so scoped services (like `HttpUserContext`) resolve fresh per message. Per-connection scopes are kept for the lifetime of the socket.

## [13.2.8] - 2026-04-22

### ⬆️ Dependencies

- Updated `@furystack/rest-service` to the new major version (no API changes required in this package).

## [13.2.7] - 2026-04-17

### ⬆️ Dependencies

- Raised `typescript` to ^6.0.3 and `vitest` to ^4.1.4 so package builds and tests track the workspace toolchain.

## [13.2.6] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [13.2.5] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1
- Upgraded `ws` from ^8.19.0 to ^8.20.0

## [13.2.4] - 2026-03-19

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0
- 13.2.3 patch: updated `@furystack/core` dependency to the new major version (2026‑03‑10).

## [13.2.3] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [13.2.2] - 2026-03-07

### ⬆️ Dependencies

- Updated internal FuryStack dependencies
- Updated `@furystack/rest-service` dependency

## [13.2.1] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

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
