# Spike: `@furystack/cross-node-bus` — shared cross-process event bus

## Goal

Provide a single, transport-agnostic publish/subscribe primitive that
multiple FuryStack subsystems (and applications) can use to keep state
consistent across processes behind a load balancer. Specialized
"facades" — `ChangeBroadcaster` for entity-sync,
`IdentityEventBroadcaster` for auth, app-defined facades for custom
events — sit on top of the shared bus and reuse the same transport
configuration.

## Motivation — multi-node hazards inventory

Today every cross-cutting in-memory channel in the framework is
process-local. None of these propagate to sibling instances:

| Subsystem   | Channel                                                                        | Today's behavior      | Multi-node failure                                                   |
| ----------- | ------------------------------------------------------------------------------ | --------------------- | -------------------------------------------------------------------- |
| Entity sync | `DataSet.emit('onEntityAdded' \| 'onEntityUpdated' \| 'onEntityRemoved', ...)` | In-process `EventHub` | Write on node A → subscribers on node B never see it.                |
| Auth        | `HttpUserContext.emit('onLogin' \| 'onLogout' \| 'onSessionInvalidated', ...)` | In-process `EventHub` | Logout on node A → cookie cache on node B stays populated until TTL. |
| Auth        | `UserResolutionCache.invalidate(...)`                                          | In-process Map        | Manual invalidation on one node has no effect on siblings.           |
| Custom      | App-defined `EventHub`s, `ObservableValue`s                                    | In-process            | Anything subscribed for cross-node coordination silently no-ops.     |

The
[`@furystack/rest-service` short-TTL user-resolution cache](../../packages/rest-service/src/user-resolution-cache.ts) bounds
identity staleness to the configured TTL window. A cross-node bus
collapses that window from "TTL" (default 30 s) to "bus latency"
(single-digit ms with Redis pub/sub) for the cases where it matters.

## Architecture: shared transport, specialized facades

```
+-------------------------+   +--------------------------+   +--------------------------+
| ChangeBroadcaster       |   | IdentityEventBroadcaster |   | App-defined facades      |
| (entity-sync-service)   |   | (rest-service)           |   |                          |
| - sequencing            |   | - typed events           |   | - custom topics          |
| - replay window         |   | - cache invalidation     |   |                          |
+-----------+-------------+   +-------------+------------+   +-------------+------------+
            |                               |                              |
            +----------+-----------+--------+------------+-----------------+
                       |           |                     |
                       v           v                     v
                +------------------------------------------------+
                |  @furystack/cross-node-bus (CrossNodeBus token) |
                |  publish(topic, msg) / subscribe(topic, h) / id |
                +-----------------+-------------------------------+
                                  |
                +-----------------+-----------------+
                |                                   |
                v                                   v
        InProcessAdapter                    Adapter packages
        (default)                            (separate publishable units)
```

- **`@furystack/cross-node-bus`** owns the abstraction: minimal
  `CrossNodeBus` interface, default `InProcessAdapter`, and the DI
  token. No transport-specific code.
- **Adapter packages** (`@furystack/cross-node-bus-redis`,
  `@furystack/cross-node-bus-nats`, …) live separately and are bound
  by the application:

  ```ts
  injector.bind(CrossNodeBus, () => new RedisStreamsBus({ url: '…' }))
  ```

- **Subsystem facades** are typed, opinionated wrappers. Each owns its
  own concerns (sequencing, replay, cache invalidation logic) and
  consumes the shared `CrossNodeBus` token.
- **Apps can also use `CrossNodeBus` directly** for custom domain
  events without spinning up a facade.

This mirrors how `@furystack/logging` / `@furystack/cache` are
structured today — pluggable backend behind a typed token, with
feature-specific consumers.

## The bus interface

```ts
export interface CrossNodeBus extends Disposable {
  /** Stable, unique id of this node. Included in every published message. */
  readonly nodeId: string

  /**
   * Publishes `message` on `topic`. Returns once the message has been
   * accepted by the underlying transport (not when it has been delivered).
   */
  publish(topic: string, message: BusMessage): Promise<void>

  /**
   * Subscribes to every message published on `topic`, including ones
   * originating from this node. Subscribers must filter by `originId`
   * themselves if they want local/remote distinction.
   */
  subscribe(topic: string, handler: (message: BusMessage) => void): Disposable
}

export interface BusMessage {
  /** Wire-format version. Adapters refuse incompatible versions. */
  readonly v: 1
  /** `nodeId` of the publisher. */
  readonly originId: string
  /** ISO-8601 publish timestamp from the publisher's clock (diagnostic only). */
  readonly emittedAt: string
  /** Caller-supplied payload. Must be JSON-serializable. */
  readonly payload: unknown
}
```

Deliberately minimal:

- No request/response. Pure pub/sub.
- No persistence guarantees on the interface — adapters declare their
  own. Consumers that need replay (entity-sync) must check the
  capability or pin the adapter.
- No typed topics on the interface. Facades layer types on top
  (`IdentityEventBroadcaster.publish('userLoggedOut', { sessionId })`).
- `subscribe` returns a `Disposable`; teardown via `[Symbol.dispose]`.

## Adapters

Recommended order of implementation:

| Adapter                  | Persistence        | Sequencing    | Replay | Setup cost          | First impl?                   |
| ------------------------ | ------------------ | ------------- | ------ | ------------------- | ----------------------------- |
| In-process               | n/a                | local counter | n/a    | none                | ✅ ships with the bus package |
| Redis Streams            | ✅                 | server        | ✅     | low                 | ✅ first concrete adapter     |
| Redis pub/sub            | ❌                 | self-managed  | ❌     | low                 | maybe                         |
| NATS JetStream           | ✅                 | server        | ✅     | medium              | later                         |
| Postgres `LISTEN/NOTIFY` | ❌ (advisory only) | self-managed  | ❌     | low (already in DB) | later                         |
| Kafka                    | ✅                 | server        | ✅     | high                | later                         |

Redis Streams is the recommended first concrete adapter — small ops
surface, native sequencing, native replay, easy local development with
docker-compose.

### Capability advertisement

```ts
export interface CrossNodeBusCapabilities {
  readonly persistent: boolean
  readonly replay: boolean
  readonly assignsSequence: boolean
}

export interface CrossNodeBus extends Disposable {
  readonly capabilities: CrossNodeBusCapabilities
  // …
}
```

Consumers that need replay assert
`bus.capabilities.replay === true` at registration time and refuse to
start otherwise.

## Consumer 1 — `ChangeBroadcaster` (entity-sync)

Replaces `SubscriptionManager`'s direct `dataSet.subscribe(...)`
callbacks with a single fan-out path through the bus.

### Today's wiring

```ts
registration.eventSubscriptions = [
  dataSet.subscribe('onEntityAdded', ({ entity }) => {
    this.handleEntityAdded(modelName, entity, entity[primaryKey])
  }),
  // …
]
```

`handleEntityAdded` walks `this.subscriptions` (process-local) and
pushes notifications to local sockets only.

### Proposed wiring

```ts
dataSet.subscribe('onEntityAdded', ({ entity }) => {
  // publish to bus first; local fan-out happens via the subscribe()
  // callback below — single fan-out path
  void this.broadcaster.publish(modelName, {
    type: 'added',
    entity,
    primaryKey: (entity as Record<string, unknown>)[primaryKey],
  })
})

const handle = this.broadcaster.subscribe(modelName, (change) => {
  this.handleBroadcastChange(modelName, change)
})
```

`handleEntityAdded` / `handleEntityUpdated` / `handleEntityRemoved`
become handlers on `BroadcastChange` events. Their existing logic
(build `ServerSyncMessage`, walk `this.subscriptions`, push to sockets)
stays as-is.

### `BroadcastChange` payload

```ts
export type BroadcastChange =
  | { type: 'added'; entity: unknown; primaryKey: string }
  | { type: 'updated'; id: unknown; change: Record<string, unknown> }
  | { type: 'removed'; id: unknown }
```

Wrapped in `BusMessage` by the bus (versioning, originId, timestamp
already there — no need to duplicate on the payload).

### Sequence numbers

`registration.currentSeq` is per-process today. With multiple nodes,
each subscriber sees gaps and out-of-order deltas. Options:

- **(A) Authoritative sequence in the bus.** Adapters that support
  `assignsSequence` provide a server-assigned monotonic seq. The
  in-process adapter keeps a local counter (matching today's behavior).
  **Recommended.**
- **(B) Logical clock per node + reconcile.** Hard. Don't.
- **(C) Drop seq, use timestamps.** Breaks delta sync replay. Rejected.

(A) means `incrementVersion` moves out of `SubscriptionManager` and
into the broadcaster; the broadcaster stamps `version: SyncVersion` on
the outbound `ServerSyncMessage` using the bus-assigned seq.

### Open design questions

1. **Payload size.** `onEntityAdded` carries the full entity; for some
   models that may include large blobs. Worth defining a "broadcast
   payload" hook on `DataSetSettings` so models can opt to broadcast
   only `id` and have other nodes fetch the entity locally.
2. **Authorization at publish time.** Today `authorizeGet` runs on the
   receiving node when re-evaluating a collection (using the captured
   identity from PR #639). With cross-node fan-out, the writing node
   doesn't know which subscribers exist on which nodes. The receiving
   node must continue to filter by identity. Don't filter on publish.
3. **Replay window.** The current per-process `changelog` could be
   retired in favor of bus replay, or kept as a hot read-through cache.
   Recommend keep + augment: subscribers fetch from local changelog if
   covered, otherwise fall back to bus replay if the adapter supports
   it, otherwise full snapshot.
4. **Backpressure.** Bursty models could flood the bus. Existing
   `debounceMs` / `queryTtlMs` collection-evaluation knobs help;
   consider exposing a per-model bus-rate-limit too.

## Consumer 2 — `IdentityEventBroadcaster` (rest-service)

Closes the gap between local `HttpUserContext` events (which fire only
on the originating node) and cross-instance state. Collapses the
identity-staleness window from `userCacheTtlMs` (default 30 s) to
"bus latency" for the events where sub-TTL freshness matters.

### Event shapes

```ts
export type IdentityEvent =
  | { type: 'userLoggedOut'; sessionId: string }
  | { type: 'sessionInvalidated'; sessionId: string }
  | { type: 'userRolesChanged'; username: string }
  | { type: 'userDeleted'; username: string }
  | { type: 'passwordChanged'; username: string }
```

### Wiring

`HttpUserContext.cookieLogout` already invalidates the local cache
entry. Extend it to also publish:

```ts
public async cookieLogout(request, response): Promise<void> {
  const sessionId = this.getSessionIdFromRequest(request)
  // … existing cookie clearing + session-store removal …

  if (sessionId) {
    this.userCache.invalidate(`cookie:${sessionId}`)
    void this.identityEventBroadcaster.publish({ type: 'userLoggedOut', sessionId })
  }
  this.emit('onLogout', undefined)
}
```

Subscribers on every node react:

```ts
identityEventBroadcaster.subscribe((event) => {
  switch (event.type) {
    case 'userLoggedOut':
    case 'sessionInvalidated':
      userCache.invalidate(`cookie:${event.sessionId}`)
      // Optional: walk WebSocket connections, close any whose
      // `request.headers.cookie` carries this sessionId.
      break
    case 'userRolesChanged':
    case 'userDeleted':
    case 'passwordChanged':
      userCache.invalidateByUser(event.username)
      break
  }
})
```

### `invalidateByUser` — the cache-API gap

`UserResolutionCache` keys by `cookie:${sessionId}`. Invalidating by
username requires either:

- **Option A — secondary index inside the cache.**
  Maintain `Map<username, Set<cacheKey>>` populated when entries are
  resolved. `invalidateByUser(username)` walks the set and invalidates
  each. ~20 LOC. Local concern, doesn't infect the cache API.
  **Recommended.**
- **Option B — predicate-based invalidation against the cached value.**
  Requires fixing `Cache.removeRange` to work with custom `getKey`
  (today its `JSON.parse(key)` step breaks). Wider blast radius.

### Consumers also wire to existing `HttpUserContext` events

`HttpUserContext` already emits `onLogin` / `onLogout` /
`onSessionInvalidated`. Wire them to the broadcaster as the publish
side; no need for callers to learn a new API. Apps that already
listen to `HttpUserContext` events continue to receive them
**locally**; cross-node fan-out is additive.

### What does **not** propagate via this broadcaster

- `onLogin` is intentionally **not** published. A cache populated for
  a fresh session is harmless on remote nodes; let TTL handle it.
- Bulk operations ("invalidate everything for tenant X") should publish
  a single high-level event rather than fanning out N
  per-user/per-session events.

## Consumer 3 — application-defined facades

Apps can use `CrossNodeBus` directly. Pattern:

```ts
type AppEvent = { type: 'featureFlagChanged'; flag: string; value: boolean } | { type: 'configReloaded' }

const APP_TOPIC = 'my-app/events'

const bus = injector.get(CrossNodeBus)

await bus.publish(APP_TOPIC, {
  v: 1,
  originId: bus.nodeId,
  emittedAt: new Date().toISOString(),
  payload: { type: 'featureFlagChanged', flag: 'new-ui', value: true } satisfies AppEvent,
})

const handle = bus.subscribe(APP_TOPIC, ({ payload }) => {
  const event = payload as AppEvent
  // …
})
```

Documented as "build your own facade" rather than building a
generic-typed-topic registry into the bus — TypeScript's string-keyed
topic registries always compromise either type safety or DX.

## Cross-cutting concerns

### Delivery semantics

- **At-least-once vs at-most-once:** entity-sync clients tolerate
  duplicates (state-snapshot diffing already deduplicates). Identity
  events are idempotent (invalidating an already-invalid entry is a
  no-op). Prefer **at-least-once**.
- **Ordering:** per-topic FIFO from a given publisher is sufficient.
  Total ordering across publishers is **not** required for any current
  consumer.

### Schema versioning

`BusMessage.v` is a hard pin. Adapters refuse incompatible versions
with a logged error and a metric. Bumping the wire-format version is a
breaking change for the bus package; consumers continue to pin their
own payload shapes inside `payload`.

### Origin filter

The bus delivers a publisher's own messages back to it (single
fan-out path). Consumers that need to deduplicate local-vs-remote use
`message.originId === bus.nodeId`. The default is **not** to filter —
this avoids surprises when a node both writes and serves a subscriber.

### Security

Adapters that talk to a network broker (Redis, NATS, Kafka) must
support TLS and authentication. The bus interface stays
transport-agnostic; the configuration lives on adapter constructors.

### Observability

Every publish/subscribe path emits structured events to
`ServerTelemetryToken`:

- `onCrossNodePublished` — `{ topic, originId, byteLength }`
- `onCrossNodeReceived` — `{ topic, originId, lagMs }`
- `onCrossNodeError` — `{ topic, error, phase: 'publish' | 'subscribe' | 'serialize' }`

`lagMs` is `Date.now() - Date.parse(message.emittedAt)` — a coarse but
useful signal for tuning replication paths.

## Suggested spike work-items (incremental)

1. **Bus package & in-process adapter**
   - [ ] Create `@furystack/cross-node-bus` package with the
         `CrossNodeBus` token, `BusMessage` type, and
         `InProcessCrossNodeBus` default factory.
   - [ ] Telemetry hooks (`onCrossNodePublished` /
         `onCrossNodeReceived` / `onCrossNodeError`).
   - [ ] Unit tests covering subscribe/publish, multiple subscribers,
         disposal, originId, error isolation.
2. **`ChangeBroadcaster` facade** (entity-sync-service)
   - [ ] Define `ChangeBroadcaster` interface + token (depends on
         `CrossNodeBus`).
   - [ ] Refactor `SubscriptionManager.registerModel` to publish +
         subscribe via the broadcaster; single fan-out path.
   - [ ] Move sequence-number generation into the broadcaster;
         in-process bus keeps a local counter.
   - [ ] Verify all existing tests pass — single-node story unchanged.
   - [ ] Add a test double that simulates two `CrossNodeBus` instances
         talking via a shared in-memory channel; integration spec
         proves cross-node delivery.
3. **`IdentityEventBroadcaster` facade** (rest-service)
   - [ ] Define event union + token + factory.
   - [ ] Wire `HttpUserContext.cookieLogout` to publish.
   - [ ] Subscribe in the factory; on `userLoggedOut` /
         `sessionInvalidated` invalidate the local
         `UserResolutionCache` entry.
   - [ ] Add `invalidateByUser(username)` to `UserResolutionCache`
         backed by a secondary index.
   - [ ] (Stretch) on `userLoggedOut` walk the
         `WebSocketApi.clients` map and close any sockets whose
         `request.headers.cookie` carries the invalidated sessionId.
4. **First concrete transport adapter**
   - [ ] `@furystack/cross-node-bus-redis` package using Redis Streams
         (`XADD` / `XREAD` consumer groups).
   - [ ] Capability flags reflect persistence / replay / sequencing.
   - [ ] Manual smoke-test harness with two Node processes against a
         dockerized Redis verifies entity-sync + identity events flow
         end-to-end.

## Out of scope

- Distributed locks for write coordination (writes still go through
  the underlying store).
- Cross-node WebSocket handover ("clients on node A should keep their
  subscriptions when A drains") — sticky load balancing remains a
  prerequisite.
- Strongly-consistent state replication (this is a notification bus,
  not a state machine — apps still own their persistent stores).
- Discovery / membership / health (let the transport handle it; we
  don't need to know which nodes are up).
- Telemetry / metrics aggregation (handled by `ServerTelemetryToken`
  consumers — Prometheus scrape, Datadog agent, etc.).
- Application-level event sourcing (use a real event store like
  EventStoreDB; this bus is for notifications, not the source of
  truth).

## Related work

- PR #639 — captured-identity refactor in `SubscriptionManager`
  (prerequisite: subscriptions must not retain the per-message
  websocket scope, so cross-node delivery on a captured-identity scope
  is well-defined).
- `feat/huc-ttl-cache` (in flight at the time of writing) — short-TTL
  user-resolution cache in `@furystack/rest-service`. Bounds
  cross-instance staleness for session/role changes; this spike
  collapses that window further for the events where sub-TTL latency
  matters.
- `docs/internal/functional-di-migration-plan.md` — established the
  "interface + token + factory" pattern this spike follows for the
  `CrossNodeBus` token and every facade.
