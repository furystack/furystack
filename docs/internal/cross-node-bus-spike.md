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

## Constraints

Hard prerequisites the bus does **not** solve and that the
deployment must satisfy:

- **Sticky load balancing for WebSocket connections.** A WS connection
  is owned by exactly one node; cross-node WS handover is out of scope
  for this spike. Drain = brief disconnect; the existing
  initial-snapshot path on reconnect covers state recovery. HTTP
  traffic does **not** need to be sticky.
- **Shared session store across all nodes (and across all services).**
  `HttpUserContext` is already pluggable on the session store; the
  multi-node story assumes every process points at the same backing
  store (Redis, Postgres, etc.). Without this, identity resolution
  diverges per node and no amount of bus traffic fixes it.
- **Shared persistent stores per `DataSet`.** Entity-sync notifies of
  changes; it is not an event-sourced store. The actual entity data
  must live in a multi-node-safe store (DB, etc.).

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

## Topology — multi-service deployment with a public gateway

The framework target is **N services × M nodes per service behind a
public gateway**. The bus does not impose a topology, but the
deployment guidance is:

```
                    +----------------+
                    | public gateway |  (rest-service proxy module)
                    | - L7 routing   |
                    | - bus consumer |
                    +-------+--------+
                            |
        +-------------------+-------------------+
        |                   |                   |
   +----+----+         +----+----+         +----+----+
   | svc-a   |         | svc-b   |         | svc-c   |
   | × N pods|         | × N pods|         | × N pods|
   +----+----+         +----+----+         +----+----+
        |                   |                   |
        +---------+---------+---------+---------+
                  |                   |
                  v                   v
            +-----------+       +-------------+
            | shared    |       | shared      |
            | session / |       | bus broker  |
            | identity  |       | (e.g. Redis |
            | store     |       |  Streams)   |
            +-----------+       +-------------+
```

### Single shared bus, per-service topic prefix

One broker instance serves the whole fleet. Each service binds its
adapter with a topic prefix from configuration:

```ts
injector.bind(
  CrossNodeBus,
  () =>
    new RedisStreamsBus({
      url: '…',
      topicPrefix: 'svc-a/',
      serviceName: 'svc-a',
    }),
)
```

Facades subscribe/publish under their own sub-namespace
(`entity/User`, `identity/`, `app/`); the adapter prefixes every
topic with `topicPrefix` on the wire. Cross-service eavesdropping
remains possible (single broker), but accidental collisions with
other services' topics are not.

### `nodeId` convention

`nodeId = ${serviceName}-${random}` (random tail per process start).
Stable per process, unique across services, debuggable in
telemetry. The factory should default to this when
`serviceName` is provided to the adapter.

### Gateway service

The gateway is a Furystack service implemented on top of
`@furystack/rest-service` plus a routing module. MVP scope:

- L7 path/host routing to backend services.
- Forwards request as-is — services keep owning auth, no
  identity-header trust between gateway and services.
- Itself a participant on the shared bus once it has any local state
  worth invalidating (e.g. a per-route cache, a session lookup
  cache). Subscribes to `IdentityEventBroadcaster` events to
  invalidate the same way every other node does.

Auth-terminating gateway, per-request token exchange, and
service-to-service signed identity headers are deliberately
out of scope for the MVP — they duplicate logic that already lives
behind a shared session store.

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

| Adapter                  | Persistence        | Server seq | Replay | Setup cost          | Identity facade | Change facade | First impl?                   |
| ------------------------ | ------------------ | ---------- | ------ | ------------------- | --------------- | ------------- | ----------------------------- |
| In-process               | n/a                | local      | yes\*  | none                | yes             | yes           | ✅ ships with the bus package |
| Redis Streams            | ✅                 | yes        | ✅     | low                 | yes             | yes           | ✅ first concrete adapter     |
| Redis pub/sub            | ❌                 | no         | ❌     | low                 | yes             | no            | maybe                         |
| NATS JetStream           | ✅                 | yes        | ✅     | medium              | yes             | yes           | later                         |
| Kafka                    | ✅                 | yes        | ✅     | high                | yes             | yes           | later                         |
| RabbitMQ Streams         | ✅                 | yes        | ✅     | medium              | yes             | yes           | later                         |
| RabbitMQ (classic AMQP)  | ❌                 | no         | ❌     | low                 | yes             | no            | later                         |
| MQTT                     | ❌                 | no         | ❌     | low                 | yes             | no            | later                         |
| Postgres `LISTEN/NOTIFY` | ❌ (advisory only) | no         | ❌     | low (already in DB) | yes             | no            | later                         |

\* The in-process adapter is single-process by definition; "replay"
means the local ring buffer used by reconnecting clients.

Redis Streams is the recommended first concrete adapter — small ops
surface, native sequencing, native replay, easy local development with
docker-compose.

**Capability contract per facade:**

- `IdentityEventBroadcaster` works on **any** transport — events are
  fire-and-forget, all handlers are idempotent, no ordering or
  replay required.
- `ChangeBroadcaster` requires `capabilities.replay === true && capabilities.assignsSequence === true`
  and asserts both at registration; otherwise it refuses to start.
  Adapters that lack one are fine for `IdentityEventBroadcaster`
  and app-defined facades but cannot serve entity-sync.

This makes "shared bus across services" workable even when the
chosen broker (e.g. RabbitMQ AMQP, MQTT) cannot serve entity-sync —
non-replay-needing facades still ride the same transport.

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

### Server-side seq dedup

The bus is at-least-once; retransmits and reconnect-driven replay can
deliver the same `BroadcastChange` to a node twice. Rather than rely
on client-side dedup, the broadcaster tracks `lastSeenSeq` per
`(topic, originId)` and drops any `seq <= lastSeenSeq` before pushing
to local WS subscribers. Cheap (one map lookup per message), kills
retransmit-induced bursts, removes the need for clients to know how
to deduplicate. ~10 LOC, runs in the bus-subscribe handler before
the existing `handleBroadcastChange` call.

### Replay window

Drop the per-process `changelog` in favor of bus replay as the single
source of truth.

- Reconnecting clients with a known last-seen seq → broadcaster asks
  the bus for messages from that seq onward (`bus.replay(topic, fromSeq)`).
- The in-process adapter implements `replay` via a local ring buffer —
  this is what `changelog` is today; same data structure, owned by the
  bus instead of `SubscriptionManager`.
- Adapters that don't support replay refuse to host `ChangeBroadcaster`
  at registration time (capability assertion above), so the broadcaster
  can rely on `bus.replay` always being available when it runs.
- If the requested `fromSeq` is older than the bus's retained window,
  the broadcaster falls back to the existing full-snapshot path.

This removes the "covered by local changelog?" branching that hides
multi-node correctness bugs single-node tests can't catch — the
writing node's changelog is the only one that contains a write, so
any code path that prefers it skips writes from siblings.

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
3. **Backpressure.** Bursty models could flood the bus. Existing
   `debounceMs` / `queryTtlMs` collection-evaluation knobs help;
   consider exposing a per-model bus-rate-limit later. Guardrail for
   the eventual implementer: when a model exceeds bus throughput, the
   correct strategy is **coalesce** (publish only the latest change
   per primary key within a window), **not drop** — entity-sync state
   is a "what's the current value?" channel, not an audit log.

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

### `invalidateByUser`

`UserResolutionCache` keys by `cookie:${sessionId}`. Invalidate by
username via `Cache.removeRange` with a predicate over the cached
value:

```ts
public invalidateByUser(username: string): void {
  this.cache.removeRange((value) => value.username === username)
}
```

`Cache.removeRange` already passes `(value, args)` to the predicate
(see `cache-state-manager.ts` and the spec `Should expose the original
args in obsoleteRange / removeRange predicates with a custom getKey`),
so custom `getKey` is a non-issue. The cache is bounded (per-process,
short TTL, low cardinality) — an O(n) scan on rare invalidation
events is irrelevant. No secondary index, no extra invariant to
maintain.

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

For the common "I only care about messages from other nodes" pattern,
the bus exposes a small helper:

```ts
bus.subscribeRemoteOnly(topic, (message) => {
  /* ... */
})
```

Equivalent to `bus.subscribe(topic, m => { if (m.originId !== bus.nodeId) handler(m) })`.
~5 LOC, no semantic change to the bus interface — pure convenience
for app-defined facades.

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
         using `Cache.removeRange` with a value-predicate.
   - [ ] (Stretch) on `userLoggedOut` walk the
         `WebSocketApi.clients` map and close any sockets whose
         `request.headers.cookie` carries the invalidated sessionId.
4. **First concrete transport adapter**
   - [ ] `@furystack/cross-node-bus-redis` package using Redis Streams
         (`XADD` / `XREAD` consumer groups).
   - [ ] Capability flags reflect persistence / replay / sequencing.
   - [ ] Adapter constructor accepts `{ url, topicPrefix, serviceName }`;
         `nodeId` defaults to `${serviceName}-${random}`.
   - [ ] Manual smoke-test harness with two Node processes against a
         dockerized Redis verifies entity-sync + identity events flow
         end-to-end.
5. **Multi-service smoke-test**
   - [ ] Two services × two nodes each, single Redis, distinct
         `topicPrefix` per service. Assert: events stay scoped to
         their prefix; an `IdentityEvent` published by service A's
         auth path invalidates caches on every node of service A and
         only there; service B sees nothing on its own subscriptions.

## Known residual risks

These are not blockers but should be called out before implementation:

- **Cold-start ordering on `IdentityEventBroadcaster`.** A node
  booting after another node has already published an identity event
  misses that event entirely (no replay required for this facade).
  Consequence: a freshly booted node serves stale identity until the
  `UserResolutionCache` TTL expires (default 30 s). This is bounded by
  design — the cache TTL is the worst-case staleness window. Document
  but do not fix.
- **Schema-version skew during rolling deploys.** `BusMessage.v` is a
  hard pin; mid-rollout, a v1 node and a v2 node share a topic and
  refuse each other's messages. Two coping strategies:
  1. Wire-format bumps require a fleet-wide deploy fence (drain
     everything, deploy v2, resume) — simple, disruptive.
  2. Always ship one cycle of "v2-aware, v1-emitting" nodes that
     accept both versions, then a follow-up cycle that emits v2 — no
     downtime, two deploys per breaking change.
     Spike does not pick one; the operator does. Pin the choice in
     release notes when the first v2 lands.

## Out of scope

- Distributed locks for write coordination (writes still go through
  the underlying store).
- Cross-node WebSocket handover ("clients on node A should keep their
  subscriptions when A drains") — see Constraints; sticky load
  balancing is the assumed deployment shape.
- Auth-terminating gateway, signed identity headers between gateway
  and services, per-request token exchange. Gateway MVP forwards
  requests as-is and lets services own auth via the shared session
  store.
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
