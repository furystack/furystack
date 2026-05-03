<!-- version-type: major -->

# @furystack/entity-sync-service

## 💥 Breaking Changes

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

## 🗑️ Deprecated

### `ModelSyncOptions.changelogRetentionMs`

The bus adapter owns retention now. The field is accepted for backwards compatibility and **silently ignored**.

```typescript
// ⚠️ accepted but ignored — configure on the bus adapter instead
useEntitySync(injector, {
  models: [{ dataSet: UserDataSet, options: { changelogRetentionMs: 60_000 } }],
})
```

Configure retention on the bus adapter (in-process default keeps 1 000 messages per topic; Redis Streams uses `MAXLEN`). The field will be removed in a future major.

## ✨ Features

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

## ⬆️ Dependencies

- Adds `@furystack/cross-node-bus` as a runtime dependency. The new `EntityChangeBus` facade is built on top of it. Resolves to the in-process default bus unless an adapter is bound; multi-node deployments override `CrossNodeBus` with a transport adapter such as `@furystack/redis-cross-node-bus`.

## ♻️ Refactoring

### `SubscriptionManager` internals reorganised around the bus

`ModelRegistration.eventSubscriptions` is split into `dataSetSubscriptions` (publish side) and `busSubscription` (consume side). Per-model changelogs and per-model `currentSeq` counters are gone; the manager keeps `lastSeqByModel` (last seen bus-stamped seq per model) plus a per-(model, originId) dedup map with periodic idle eviction. The dispatch path now derives `version` from the bus envelope rather than minting it locally.

## 🧪 Tests

- New `change-log.spec.ts` covers the bus-backed `ChangeLog` helper used by delta sync.
- New `entity-change-bus.spec.ts` covers the facade in isolation; `entity-change-bus.integration.spec.ts` covers the multi-node flow against an in-process bus network.
- `subscription-manager.spec.ts` rewritten to assert bus-backed publish/consume semantics and the `changelogRetentionMs` deprecation no-op.
- `entity-sync.integration.spec.ts` updated for the new opaque-seq wire shape.
