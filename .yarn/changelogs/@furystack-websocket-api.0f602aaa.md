<!-- version-type: major -->

# @furystack/websocket-api

## 💥 Breaking Changes

Class-based WebSocket actions are gone — use plain-object action descriptors. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed the `WebSocketApiSettings` token. Settings are now inline on `useWebSocketApi({ injector, port, hostName?, path?, actions? })`.
- Removed the class-based `WebSocketAction` contract (`@Injectable`, static `canExecute`, `@Injected` deps). `WebSocketAction` is now `{ canExecute(ctx): boolean; execute(ctx & { injector }): Promise<void> }`. Dependencies are resolved from `context.injector` (a per-message scope) on demand.
- Renamed `useWebsockets(injector, opts)` → `useWebSocketApi({ injector, ... })`. The returned handle exposes `subscribe` / `emit` for `onConnect` / `onDisconnect`, a `broadcast(cb)` helper, and the underlying `socket` / `serverApi` references. Multiple endpoints on one injector are now supported.
- Action failures route to `ServerTelemetryToken#onWebSocketActionFailed` (new event) instead of the deleted `WebSocketApi` class events.
- Each message gets a fresh injector scope so scoped services (like `HttpUserContext`) resolve fresh per message. Per-connection scopes are kept for the lifetime of the socket.
