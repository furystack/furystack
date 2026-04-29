# PRD: `@furystack/cross-node-bus` — Cross-Node Event Bus

| Field | Value |
| ----- | ----- |
| Status | Draft |
| Owner | FuryStack Team |
| Target | v8.2.0 |
| Doc ID | PRD-2025-003 |

---

## 1. Overview

**Problem:** FuryStack's core subsystems maintain in-memory state channels that don't propagate across processes. This causes correctness bugs in multi-node deployments:

| Subsystem | Channel | Multi-node failure |
|----------|---------|-------------------|
| Entity sync | `DataSet.emit('onEntity*')` | Write on node A → subscribers on node B never see it |
| Auth | `HttpUserContext.emit('onLogin'\|'onLogout')` | Logout on node A → cache on node B stays populated |
| Custom apps | `EventHub`, `ObservableValue` | Cross-node coordination silently no-ops |

**Solution:** Provide a shared publish/subscribe bus (`CrossNodeBus`) that multiple FuryStack subsystems and applications can use to keep state consistent across processes behind a load balancer.

**Scope of this PRD:**
1. **Core package** (`@furystack/cross-node-bus`) — transport-agnostic bus abstraction
2. **In-process adapter** — default single-node implementation
3. **ChangeBroadcaster facade** — entity-sync multi-node support
4. **IdentityEventBroadcaster facade** — auth cache invalidation across nodes
5. **Redis Streams adapter** — first concrete multi-node transport

---

## 2. Goals & Success Criteria

### Goals

1. **Enable multi-node entity sync** — Entity changes on any node propagate to subscribers on all other nodes
2. **Enable cross-node auth cache invalidation** — Logout/role-change events clear caches on all nodes within bus latency
3. **Provide a reusable abstraction** — Applications can build their own facades on top of the bus
4. **Maintain backward compatibility** — Single-node deployments work unchanged

### Success Metrics

| Metric | Target |
|--------|--------|
| Entity change propagation latency (Redis) | < 50ms P99 |
| Auth cache invalidation latency | < 50ms P99 |
| Single-node test pass rate | 100% (existing tests unchanged) |
| Multi-node e2e test pass rate | 100% |
| Breaking changes to existing APIs | 0 |

### Non-Goals

- Distributed write coordination (writes still go through the underlying store)
- Cross-node WebSocket handover (sticky sessions assumed)
- Auth-terminating gateway
- Strongly-consistent state replication
- Service discovery / health monitoring

---

## 3. User Stories

### Entity Sync Users

| As a | I want to | So that |
|------|-----------|---------|
| Developer using entity-sync-service | Entity changes to propagate across all nodes | Subscribers connected to any node see consistent data |
| Developer using entity-sync-client | Reconnecting after disconnect receives only delta changes | I don't refetch the entire collection on reconnect |
| Developer with a high-frequency model | Changes batched within a window | The bus isn't flooded with rapid updates |
| Developer with large entities | Only broadcast primary key for re-fetch | I avoid sending megabytes over the bus |

### Auth Users

| As a | I want to | So that |
|------|-----------|---------|
| End user | Logout immediately invalidates my session everywhere | My session is truly terminated on all nodes |
| Admin | Role change reflects immediately | Users don't retain stale permissions |
| Developer | Cache invalidation happens within bus latency | I don't need a long user-resolution TTL |

### Application Users

| As a | I want to | So that |
|------|-----------|---------|
| Application developer | A shared pub/sub primitive I can use | I can coordinate custom app events across nodes |
| Operations | Telemetry on publish/subscribe performance | I can monitor bus health |

---

## 4. Functional Requirements

### FR-1: CrossNodeBus Core Interface

The bus MUST provide:

```ts
interface CrossNodeBus extends Disposable {
  readonly nodeId: string
  readonly capabilities: CrossNodeBusCapabilities

  publish(topic: string, message: BusMessage): Promise<void>
  subscribe(topic: string, handler: (message: BusMessage) => void): Disposable
  subscribeRemoteOnly(topic: string, handler: (message: BusMessage) => void): Disposable
}

interface CrossNodeBusCapabilities {
  readonly persistent: boolean   // messages survive broker restart
  readonly replay: boolean     // can replay from a sequence
  readonly assignsSequence: boolean // broker assigns monotonic seq
}

interface BusMessage {
  readonly v: 1               // wire format version
  readonly originId: string      // nodeId of publisher
  readonly emittedAt: string    // ISO-8601 timestamp
  readonly payload: unknown    // caller-supplied, JSON-serializable
}
```

**Rationale:** Minimal interface enables adapter variation. `subscribeRemoteOnly` is a convenience method for the common "I only care about other nodes" pattern.

### FR-2: Default In-Process Adapter

Single-node deployments MUST work without any external broker:

- `InProcessCrossNodeBus` is the default factory
- Provides in-memory pub/sub within a single process
- Does NOT satisfy `replay === true` or `assignsSequence === true`
- Envelope: `{ CrossNodeBus, use: (injector) => new InProcessCrossNodeBus() }`

### FR-3: ChangeBroadcaster Facade (Entity Sync)

ChangeBroadcaster MUST:

1. **Publish changes** — Listen to `DataSet` events (`onEntityAdded`, `onEntityUpdated`, `onEntityRemoved`) and publish to the bus
2. **Subscribe for fan-out** — Re-deliver received changes to local WebSocket subscribers
3. **Support delta sync** — Use bus-assigned sequence numbers for delta sync; falls back to full snapshot if requested seq is outside replay window
4. **Deduplicate** — Track `lastSeenSeq` per `(topic, originId)` and drop duplicates before local delivery

Payload shapes:

```ts
type BroadcastChange =
  | { type: 'added'; entity: unknown; primaryKey: string }
  | { type: 'updated'; id: unknown; change: Record<string, unknown> }
  | { type: 'removed'; id: unknown }
```

**Capability assertion:** ChangeBroadcaster MUST assert at registration that `bus.capabilities.replay === true && bus.capabilities.assignsSequence === true`; refuse to start otherwise.

### FR-4: IdentityEventBroadcaster Facade (Auth)

IdentityEventBroadcaster MUST:

1. **Listen to local events** — Subscribe to `HttpUserContext` events (`onLogout`, `onSessionInvalidated`, `onLogin` not broadcast)
2. **Publish identity events** — Publish to the bus on relevant events
3. **Subscribe for cache invalidation** — On received events, invalidate local `UserResolutionCache`
4. **Support user-based invalidation** — `invalidateByUser(username)` using `Cache.removeRange`

Event shapes:

```ts
type IdentityEvent =
  | { type: 'userLoggedOut'; sessionId: string }
  | { type: 'sessionInvalidated'; sessionId: string }
  | { type: 'userRolesChanged'; username: string }
  | { type: 'userDeleted'; username: string }
  | { type: 'passwordChanged'; username: string }
```

**Rationale:** `onLogin` is NOT broadcast — a cache populated for a fresh session is harmless on remote nodes; TTL handles it.

### FR-5: Redis Streams Adapter

The `@furystack/cross-node-bus-redis` package MUST:

1. **Implement full CrossNodeBus interface** — With persistent, replay, and assignsSequence === true
2. **Use Redis Streams** — Via consumer groups (`XGROUP CREATE`) for ordering and delivery guarantees
3. **Support configuration** — Constructor accepts `{ url, topicPrefix, serviceName }`

```ts
const bus = new RedisStreamsBus({
  url: 'redis://localhost:6379',
  topicPrefix: 'my-service/',
  serviceName: 'my-service',
})
// nodeId defaults to `${serviceName}-${random}`
```

4. **Expose capabilities:** `{ persistent: true, replay: true, assignsSequence: true }`

### FR-6: Telemetry

The bus MUST emit structured events to `ServerTelemetryToken`:

| Event | Fields |
|-------|--------|
| `onCrossNodePublished` | `{ topic, originId, byteLength }` |
| `onCrossNodeReceived` | `{ topic, originId, lagMs }` |
| `onCrossNodeError` | `{ topic, error, phase: 'publish'|'subscribe'|'serialize' }` |

**Rationale:** Operations need visibility into bus health. `lagMs` is coarse (`Date.now() - emittedAt`) but useful.

---

## 5. Non-Functional Requirements

### NFR-1: Delivery Semantics

- **At-least-once** — Entity sync clients tolerate duplicates (state-snapshot diffing already deduplicates). Identity events are idempotent.
- **Per-topic FIFO** — From a given publisher, ordering is preserved. Total ordering across publishers is NOT required.

### NFR-2: Security

- Redis adapter MUST support TLS and authentication
- Bus interface stays transport-agnostic; configuration lives on adapter constructors

### NFR-3: Schema Versioning

- `BusMessage.v` is a hard pin. Adapters MUST reject incompatible versions with a logged error and a metric.
- Wire-format bumps are breaking changes; require fleet-wide deploy fence.

### NFR-4: Backpressure

- Existing `debounceMs` and `queryTtlMs` knobs on entity-sync continue to work
- If a model exceeds bus throughput, coalesce within a window (drop latest per primary key) — entity-sync state is "current value", not audit log

### NFR-5: Cold-Start Behavior

- A node booting after another node has already published an identity event misses that event
- Consequence: fresh node serves stale identity until TTL expires (default 30s)
- This is acceptable and bounded by design

---

## 6. UX / API Design

### Using the Core Bus

```ts
const injector = new Injector()

// Default: in-process bus
await useCrossNodeBus(injector)

// Or Redis adapter (application configures)
injector.bind(CrossNodeBus, () => new RedisStreamsBus({
  url: process.env.REDIS_URL!,
  topicPrefix: 'my-service/',
  serviceName: 'my-service',
}))
```

### Using Entity Sync (Multi-Node)

```ts
import { useEntitySync } from '@furystack/entity-sync-service'
import { SyncSubscribeAction, SyncUnsubscribeAction } from '@furystack/entity-sync-service'

await useWebsockets(injector, {
  path: '/api/sync',
  actions: [SyncSubscribeAction, SyncUnsubscribeAction],
})

await useEntitySync(injector, {
  models: [
    { model: User, primaryKey: 'id' },
    { model: ChatMessage, primaryKey: 'id', debounceMs: 100 },
  ],
})
```

**With Redis:** The entity-sync-service automatically uses `CrossNodeBus` token. No per-model configuration.

### Using Auth Cache Invalidation

```ts
import { useIdentityEventBroadcaster } from '@furystack/rest-service'

// Automatically wired when CrossNodeBus is present
await useIdentityEventBroadcaster(injector)
```

### Application-Defined Events

```ts
type AppEvent = { type: 'featureFlagChanged'; flag: string; value: boolean }

const bus = injector.get(CrossNodeBus)

await bus.publish('my-app/events', {
  payload: { type: 'featureFlagChanged', flag: 'new-ui', value: true } as AppEvent,
})

const handle = bus.subscribeRemoteOnly('my-app/events', ({ payload }) => {
  const event = payload as AppEvent
  // ...
})
```

---

## 7. Architecture

```
+----------------+   +------------------------+   +----------------+
| ChangeBroadcaster | | IdentityEventBroadcaster | | App-defined   |
| (entity-sync-service) | | (rest-service)          | | facades      |
+----------------+   +------------------------+   +----------------+
        |                         |                     |
        +----------+-------------+---------------------+
                   |
                   v
        +------------------------+
        | @furystack/cross-node-bus |
        | (CrossNodeBus token)   |
        +------------+------------+
                     |
        +------------+------------+
        |                         |
        v                         v
   InProcessAdapter          RedisStreamsBus
   (default)                 (@furystack/cross-node-bus-redis)
```

### File Structure

```
packages/
  cross-node-bus/
    src/
      index.ts                    # Token + interface
      in-process-bus.ts           # Default adapter
      capabilities.ts
  cross-node-bus-redis/
    src/
      index.ts                    # RedisStreamsBus
  entity-sync-service/
    src/
      change-broadcaster.ts       # NEW: facade
      subscription-manager.ts      # Refactored to use bus
  rest-service/
    src/
      identity-event-broadcaster.ts # NEW: facade
      http-user-context.ts         # Wired to publish events
```

---

## 8. Risks & Open Questions

### RQ-1: Payload Size

`onEntityAdded` carries the full entity. For models with large blobs, this could exceed bus/Broker throughput.

**Option A:** Add a `DataSetSettings.broadcastPayload` hook — models opt to broadcast only `id`, other nodes fetch locally.

**Option B:** Document as "don't broadcast large blobs, use refs instead."

**Decision:** Option A in scope for MVP.

### RQ-2: Authorization at Publish Time

Today `authorizeGet` runs on the receiving node (captured identity from PR #639). With cross-node fan-out, the writing node doesn't know which subscribers exist on which nodes.

**Decision:** Don't filter on publish. Receiving node continues to filter by identity.

### RQ-3: Schema Skew During Rolling Deploys

Mid-rollout, a v1 node and v2 node share a topic and refuse each other's messages.

**Option A:** Wire-format bumps require fleet-wide deploy fence (drain all, deploy v2, resume).

**Option B:** Always ship one cycle of "v2-aware, v1-emitting" nodes, then follow-up cycle that emits v2.

**Decision:** Document as operator choice. Pin in release notes when v2 lands.

### RQ-4: Discovery / Membership

The bus doesn't expose which nodes are currently connected.

**Decision:** Out of scope. Let the transport handle it.

---

## 9. Milestones

| Milestone | Deliverable | Target |
|----------|-----------|-------|
| M1 | `@furystack/cross-node-bus` core + in-process adapter | v8.2.0-alpha |
| M2 | ChangeBroadcaster in entity-sync-service | v8.2.0-alpha |
| M3 | IdentityEventBroadcaster in rest-service | v8.2.0-alpha |
| M4 | `@furystack/cross-node-bus-redis` adapter | v8.2.0-beta |
| M5 | Multi-node e2e tests | v8.2.0-rc |
| M6 | GA release | v8.2.0 |

---

## 10. Related Work

- PR #639 — captured-identity refactor in SubscriptionManager (prerequisite)
- `feat/huc-ttl-cache` — short-TTL user-resolution cache in rest-service
- `docs/internal/functional-di-migration-plan.md` — "interface + token + factory" pattern

---

## 11. Appendix: Definitions

| Term | Definition |
|------|-----------|
| Bus | Shared pub/sub primitive across processes |
| Facade | Typed, opinionated wrapper on the bus (ChangeBroadcaster, IdentityEventBroadcaster) |
| Adapter | Transport implementation (InProcess, Redis Streams) |
| Topic | String key for pub/sub routing |
| Capability | Flags indicating adapter features (replay, persistent, assignsSequence) |
| Delta sync | Client reconnects with last-seen seq, receives only changes since then |
| Cold start | A node that boots after events were already published |