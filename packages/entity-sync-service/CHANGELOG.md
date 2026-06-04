# Changelog

## [3.0.0] - 2026-05-21

### 📚 Documentation

- Rewrote JSDoc on `SubscriptionManager` and `useEntitySync` to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints, and added type-only imports for cross-file `{@link}` targets.

### ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.
- Adds `@furystack/cross-node-bus` as a runtime dependency. The new `EntityChangeBus` facade is built on top of it. Resolves to the in-process default bus unless an adapter is bound; multi-node deployments override `CrossNodeBus` with a transport adapter such as `@furystack/redis-cross-node-bus`.
- Bumped the transitive `@furystack/cache` dependency (via `@furystack/rest-service`) to its new major version. No source changes were required in this package.
- Bumped `ws` from `^8.20.0` to `^8.20.1` (runtime dependency).
- Bumped `vitest` to `^4.1.7`. Dev-tooling only.

### 💥 Breaking Changes

### `SubscriptionManager` now requires an `EntityChangeBus` binding

Entity sync is now bus-backed: `SubscriptionManager` publishes every dataset event onto the new `EntityChangeBus` (which sits on top of `@furystack/cross-node-bus`) and subscribes back to the bus to fan changes out to WebSocket clients. As a result, writes on node A wake matching subscriptions on node B — previously they did not.

**Impact:**

- `SubscriptionManager`'s factory now injects `EntityChangeBus`. The token resolves automatically (default in-process bus), so no app wiring is required for single-node deployments.
- Multi-node deployments **must** override `CrossNodeBus` with a transport adapter (e.g. `defineRedisCrossNodeBusAdapter` from `@furystack/redis-cross-node-bus`) before resolving `SubscriptionManager`. The factory throws at registration time when the bound bus lacks `replay` or `assignsSequence`.
- The bus carries the change envelope across nodes; both publishing and subscribing happen through it. Subsystems that previously inspected `SubscriptionManager`'s internal changelog will no longer see one — see the next entry.

### `getModelRegistration()` shape change — `currentSeq` is `string`, `changelogLength` removed

`SubscriptionManager.getModelRegistration(modelName)` now returns:

```typescript
// ❌ Before
{
  modelName: string
  primaryKey: string
  currentSeq: number
  changelogLength: number
}
// ✅ After
{
  modelName: string
  primaryKey: string
  currentSeq: string
}
```

`currentSeq` is the opaque adapter-assigned token — see the `@furystack/entity-sync` changelog. `changelogLength` is gone because the in-memory per-model changelog has been removed; retention now lives on the bus adapter (in-process: 1 000 messages per topic; Redis Streams: `MAXLEN`).

**Migration:** Code that read `changelogLength` for diagnostics should switch to whatever the bound bus adapter exposes. Code that did arithmetic on `currentSeq` must move to opaque-token semantics.

### `subscribeEntity(..., lastSeq?: string)` signature change

Matches the wire-format change in `@furystack/entity-sync`: the `lastSeq` parameter on `subscribeEntity` is now `string | undefined` instead of `number | undefined`. Callers are typically `SyncSubscribeAction`, which already deserialises whatever the client sent — no app code changes are expected unless `subscribeEntity` is called directly.

### Internal subscription state — `currentSeq` is `string`

`EntitySubscription.currentSeq` and `CollectionSubscription.currentSeq` are now strings. Apps that introspect the manager's internal state (debug helpers, custom probes) need to update their type expectations.

### 🗑️ Deprecated

### `ModelSyncOptions.changelogRetentionMs`

The bus adapter owns retention now. The field is accepted for backwards compatibility and **silently ignored**.

```typescript
// ⚠️ accepted but ignored — configure on the bus adapter instead
useEntitySync(injector, {
  models: [{ dataSet: UserDataSet, options: { changelogRetentionMs: 60_000 } }],
})
```

Configure retention on the bus adapter (in-process default keeps 1 000 messages per topic; Redis Streams uses `MAXLEN`). The field will be removed in a future major.

### ✨ Features

### `EntityChangeBus` facade

New typed wrapper over `CrossNodeBus` for entity-change events. Exported from the package root for apps that want to publish or observe entity changes outside the WebSocket sync flow:

```typescript
import {
  EntityChangeBus,
  topicForModel,
  type EntityChange,
  type EntityChangeEnvelope,
} from '@furystack/entity-sync-service'

const bus = injector.get(EntityChangeBus)
using sub = bus.subscribe('User', (envelope: EntityChangeEnvelope) => {
  // envelope.change is `{ type: 'added' | 'updated' | 'removed', ... }`
  // envelope.version.seq is the bus-assigned opaque token
  // envelope.originId tells you which node published
})
await bus.publish('User', { type: 'updated', id: 'alice', change: { displayName: 'Alice' } })
```

**Single fan-out path:** unlike `IdentityEventBus`, `EntityChangeBus` uses plain `subscribe` (not `subscribeRemoteOnly`). The broadcaster needs the bus-assigned seq before stamping `version` on outbound `ServerSyncMessage`s, so own publishes round-trip through the bus. Per-(modelName, originId) dedup state in `SubscriptionManager` keeps at-least-once delivery from producing duplicate messages.

### Cross-node delta sync via bus replay

Reconnecting clients that send `lastSeq` now get a delta assembled from the bus's retained window, regardless of which node they originally subscribed against. When the gap exceeds the retained window the manager falls back to a full snapshot — clients see this as `mode: 'snapshot'` exactly as before.

### New exports

- `EntityChangeBus` — singleton DI token for the typed entity-change facade.
- `topicForModel(modelName)` — derives the wire topic the bus uses for a model. Useful when wiring custom subscribers without going through `EntityChangeBus`.
- `EntityChange` (type) — discriminated union of `added` / `updated` / `removed` payloads.
- `EntityChangeEnvelope` (type) — what subscribers receive (change + version + originId + modelName).

### ♻️ Refactoring

### `SubscriptionManager` internals reorganised around the bus

`ModelRegistration.eventSubscriptions` is split into `dataSetSubscriptions` (publish side) and `busSubscription` (consume side). Per-model changelogs and per-model `currentSeq` counters are gone; the manager keeps `lastSeqByModel` (last seen bus-stamped seq per model) plus a per-(model, originId) dedup map with periodic idle eviction. The dispatch path now derives `version` from the bus envelope rather than minting it locally.

### 🧪 Tests

- New `change-log.spec.ts` covers the bus-backed `ChangeLog` helper used by delta sync.
- New `entity-change-bus.spec.ts` covers the facade in isolation; `entity-change-bus.integration.spec.ts` covers the multi-node flow against an in-process bus network.
- `subscription-manager.spec.ts` rewritten to assert bus-backed publish/consume semantics and the `changelogRetentionMs` deprecation no-op.
- `entity-sync.integration.spec.ts` updated for the new opaque-seq wire shape.

### 🔧 Chores

- Bumped to keep the `@furystack/rest-service` and `@furystack/websocket-api` peer dependencies in sync after the `UserResolutionCache` addition. No code changes.

## [2.0.1] - 2026-04-26

### 🐛 Bug Fixes

### Stop retaining the per-message websocket injector for the lifetime of a subscription

`SubscriptionManager.subscribeEntity` and `SubscriptionManager.subscribeCollection` previously stored the per-message injector handed in by `SyncSubscribeAction` as the long-lived `clientInjector` for the subscription. With `@furystack/websocket-api@14`, that injector is a per-message scope that gets disposed as soon as the action returns, so every subsequent collection re-evaluation called `findEntities`/`countEntities` on a disposed scope. On any DataSet that exposes `authorizeGet` (or anything else that resolves `IdentityContext`), this turned legitimate change notifications into `subscription-error` messages — visible to clients as snapshot/sidebar/dashboard lists that never refreshed after writes.

The manager now snapshots the caller's identity once at subscribe time (via `IdentityContext.getCurrentUser()`), spawns a fresh long-lived child of the root injector with that identity bound on a snapshot `IdentityContext` (`isAuthenticated`, `isAuthorized` derived from the captured `user.roles`, `getCurrentUser` returning the captured user), and uses that scope for the initial query as well as every subsequent re-evaluation. The captured scope is disposed on `unsubscribe`, on socket close, on `subscription-error` paths, and on manager dispose.

Anonymous callers (no `IdentityContext` bound, or `getCurrentUser()` rejects) fall back to the default unauthenticated `IdentityContext`, so `authorizeGet` hooks still see an unauthenticated identity instead of a system-elevated one.

### 🧪 Tests

- Added regression tests in `subscription-manager.spec.ts` covering the per-message scope disposal scenario:
  - Collection notifications keep flowing after the caller scope is disposed.
  - `authorizeGet` re-runs against the captured identity, not the disposed caller scope.
  - Unauthenticated callers receive `subscription-error` from `authorizeGet` (no identity leakage).
  - Captured `user.roles` are preserved across re-evaluations.
  - Entity-update notifications still flow when the caller scope is disposed.

## [2.0.0] - 2026-04-25

### 💥 Breaking Changes

Subscription management is now a DI token and sync actions are plain descriptors. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Added `SubscriptionManager` interface + singleton token (class-behind-token). Resolve via `injector.get(SubscriptionManager)`.
- `registerModel` now takes a `DataSetToken` directly: `registerModel(dataSetToken, options?)`. `modelName` and `primaryKey` are derived from the token's metadata, so the old `(Model, 'primaryKey', options?)` tuple form is gone.
- `EntitySyncModelConfig` collapsed to `{ dataSet: DataSetToken<unknown, never> } & ModelSyncOptions`.
- `useEntitySync(injector, { models: [...] })` accepts `DataSetToken` values or `EntitySyncModelConfig` objects. Call it after the stores behind those datasets are bound.
- `SyncSubscribeAction` and `SyncUnsubscribeAction` are now plain `WebSocketAction` descriptors (`{ canExecute, execute({ injector, ... }) }`). Pass them to `useWebSocketApi` in the `actions` map.

## [1.0.13] - 2026-04-22

### ⬆️ Dependencies

- Updated `@furystack/rest-service` to the new major version (no API changes required in this package).

## [1.0.12] - 2026-04-17

### ⬆️ Dependencies

- Raised `typescript` to ^6.0.3 and `vitest` to ^4.1.4 so package builds and tests track the workspace toolchain.

## [1.0.11] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [1.0.10] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1
- Upgraded `ws` from ^8.19.0 to ^8.20.0

## [1.0.9] - 2026-03-19

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0
- Updated `@furystack/core` dependency to the latest major version.

## [1.0.8] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [1.0.7] - 2026-03-07

### ⬆️ Dependencies

- Updated internal FuryStack dependencies
- Updated `@furystack/rest-service` dependency

## [1.0.6] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [1.0.5] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/entity-sync-client` with new lifecycle events via EventHub
- Updated `@furystack/rest-service` with improved error handling for malformed requests

## [1.0.4] - 2026-02-27

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

## [1.0.3] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Updated `@furystack/rest-service` dependency to pick up the new `LoginResponseStrategy` abstraction
- Bumped due to updated workspace dependencies

## [1.0.2] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

## [1.0.1] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [1.0.0] - 2026-02-22

### 💥 Breaking Changes

### Collection subscriptions now send full snapshots instead of incremental diffs

The `SubscriptionManager` no longer sends individual `entity-added`/`entity-updated`/`entity-removed` messages for collection subscription changes. Instead, it sends a single `collection-snapshot` message containing the full entries array and total count whenever a collection's data or count changes. This ensures the client always receives a consistent view of entries and count together.

See `@furystack/entity-sync` changelog for protocol-level details.

### ✨ Features

### Server-side total count tracking for collection subscriptions

The `SubscriptionManager` computes and delivers the total count of entities matching a collection filter (ignoring `top`/`skip` pagination).

- Initial `snapshot` responses include a `totalCount` field
- When entities change and the collection is re-evaluated, the server sends a `collection-snapshot` with updated entries and count
- Count queries run in parallel with data queries via `Promise.all` to minimize latency

### 🧪 Tests

- Added tests verifying that `totalCount` is included in initial snapshot responses
- Updated collection change notification tests to verify `collection-snapshot` messages
- Tests verify that redundant snapshots are suppressed when nothing changed

## [0.1.2] - 2026-02-20

### ⬆️ Dependencies

- Updated `@furystack/repository` and `@furystack/rest-service` dependencies

## [0.1.1] - 2026-02-19

### 📚 Documentation

- Expanded JSDoc on `SubscriptionManager.registerModel()` to clarify that only DataSet writes trigger sync notifications, and direct physical store writes are not detected
- Updated README to emphasize that all writes must go through the DataSet for entity sync to work, and to reference `useSystemIdentityContext` for server-side writes without an HTTP session

## [0.1.0] - 2026-02-12

### ✨ Features

### New package: server-side entity synchronization

Initial release of `@furystack/entity-sync-service`, providing server-side change tracking and WebSocket push for entity synchronization.

Core features:

- **`SubscriptionManager`** — singleton service that tracks per-model changelogs with sequence numbers, manages entity and collection subscriptions, and dispatches incremental updates to connected WebSocket clients
- **`useEntitySync`** — helper function to register models for synchronization after Repository and DataSets are configured
- **`SyncSubscribeAction`** / **`SyncUnsubscribeAction`** — WebSocket actions compatible with `@furystack/websocket-api`
- **Delta sync** — maintains a per-model changelog for sending only changes since client's `lastSeq`
- **Debounced notifications** — configurable debounce window for batching rapid changes before re-evaluating collection subscriptions
- **Query caching** — optional TTL-based caching for `find()` results on collection subscriptions

### ⬆️ Dependencies

- Added `@furystack/core` (workspace:^)
- Added `@furystack/entity-sync` (workspace:^)
- Added `@furystack/inject` (workspace:^)
- Added `@furystack/repository` (workspace:^)
- Added `@furystack/websocket-api` (workspace:^)
- Added `ws` ^8.19.0

All notable changes to the `@furystack/entity-sync-service` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
