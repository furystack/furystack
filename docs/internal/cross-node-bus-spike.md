# PRD: `@furystack/cross-node-bus` — shared cross-process event bus

> **Status:** Draft v1 · supersedes the original spike (kept in git history).
> **Owner:** FuryStack core team.
> **Target release:** initial public packages alongside next minor cycle of
> `@furystack/rest-service` and `@furystack/entity-sync-service`.

## 1. Glossary

| Term                 | Meaning                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **Bus**              | The `CrossNodeBus` abstraction defined by this PRD. Pub/sub primitive.                             |
| **Adapter**          | Concrete transport implementation of `CrossNodeBus` (in-process, Redis Streams, …).                |
| **Broker**           | The external service an adapter talks to (Redis instance, NATS server, Kafka cluster).             |
| **Facade**           | Typed, opinionated wrapper consuming the bus (`IdentityEventBus`, `EntityChangeBus`, app-defined). |
| **Topic**            | String channel identifier on the bus. Adapters may prefix it on the wire.                          |
| **Node**             | A single process instance of a service. Owns one `CrossNodeBus` instance.                          |
| **`nodeId`**         | Stable, process-unique id of a node. Stamped on every published message.                           |
| **Service**          | A logically-named deployment unit; usually scaled to multiple nodes.                               |
| **`originId`**       | The `nodeId` of the publisher; included in every received message.                                 |
| **Sequence (`seq`)** | Adapter-assigned monotonic per-topic id used for replay and dedup.                                 |
| **Replay window**    | Bounded retention of past messages an adapter can re-deliver to a reconnecting consumer.           |

## 2. Problem & motivation

FuryStack apps deploy as one or more services, each scaled to multiple nodes
behind a load balancer. Today every cross-cutting in-memory channel in the
framework is process-local: writes, logouts, cache invalidations, and
app-defined coordination events stay on the node that produced them.
Sibling nodes silently diverge until something else (TTL expiry, restart,
client reconnect) re-syncs them.

The user-visible consequences span identity, entity sync, and any custom
coordination an app builds with `EventHub` or `ObservableValue`:

| Subsystem   | Channel                                                                      | Today's behavior      | Multi-node failure                                                 |
| ----------- | ---------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------ |
| Entity sync | `DataSet.emit('onEntityAdded' \| 'onEntityUpdated' \| 'onEntityRemoved', …)` | In-process `EventHub` | Write on node A → subscribers on node B never see it.              |
| Auth        | `HttpUserContext.emit('onLogin' \| 'onLogout' \| 'onSessionInvalidated', …)` | In-process `EventHub` | Logout on node A → cookie cache on node B stays populated for TTL. |
| Auth        | `UserResolutionCache.invalidate(…)`                                          | In-process `Map`      | Manual invalidation on one node has no effect on siblings.         |
| Custom      | App-defined `EventHub`s, `ObservableValue`s                                  | In-process            | Anything subscribed for cross-node coordination silently no-ops.   |

The
[`@furystack/rest-service` short-TTL user-resolution cache](../../packages/rest-service/src/user-resolution-cache.ts)
bounds identity staleness to its TTL window. A cross-node bus collapses
that window from "TTL" (default 30 s) to "bus latency" (single-digit ms
with Redis pub/sub) for the cases where it matters.

Without a shared bus, a FuryStack app cannot be horizontally scaled
without quietly losing correctness on every channel listed above.

## 3. Goals & non-goals

### Goals

- Provide a single, transport-agnostic publish/subscribe primitive
  (`@furystack/cross-node-bus`) that every FuryStack subsystem and
  application can share.
- Ship a usable in-process default and a production-grade Redis Streams
  adapter alongside it.
- Augment the in-process `EventHub` paths in entity-sync and identity
  flows with bus-backed facades that ride **alongside** the local
  emits, **without breaking existing app code** that uses the local
  `HttpUserContext` events directly.
- Make app-defined facades a first-class extension point: app authors
  build typed wrappers over the bus the same way framework facades do.
- Enforce capability requirements at registration time so misconfigured
  deployments fail loudly, not silently.

### Non-goals

- Solve sticky load balancing, gateway/proxy concerns, or distributed
  locks (see §15 _Out of scope_).
- Replace persistent stores or become an event-sourcing primitive.
- Provide competing-consumer / work-queue semantics (see §15 _Out of scope_).
- Introduce schema-aware typed topic registries on the wire — facades
  do typing.

## 4. Success metrics

The v1 release is "done" when all four numbers hold in the smoke test
harness described in §13:

| Metric                                                         | Target                             |
| -------------------------------------------------------------- | ---------------------------------- |
| p95 publish-to-receive lag, local Redis                        | **< 50 ms**                        |
| p95 publish-to-receive lag, in-region Redis                    | **< 200 ms**                       |
| Identity staleness window (logout → remote cache invalidation) | from **30 s** TTL to **< 1 s** p99 |
| Cross-service topic leaks in the multi-service smoke test      | **0**                              |

Coverage gates:

- In-process adapter: 100 % line coverage.
- `IdentityEventBus` facade: 100 % line coverage.
- Redis adapter: integration tests gated on `docker-compose up redis`,
  same shape as `redis-store` today.
- **Multi-node integration tests with > 2 in-process bus instances are
  mandatory** for both facades.

## 5. Personas & user stories

### P1. App developer running a monolith at scale

> _I have one FuryStack service deployed as N pods behind a load
> balancer. Identity, entity sync, and my own caches all live in
> memory today. When users log out on one pod, other pods keep
> serving stale identity until TTL expires. When my admin tool
> updates an entity on pod 3, nobody else's WebSocket subscribers see
> it until a reload._

**Story:** P1 binds a Redis adapter at startup; identity events,
entity changes, and any custom `EventHub`-style coordination
propagate across pods automatically. No per-call API change.

### P2. App developer running microservices behind a public gateway

> _I have N FuryStack services, each scaled to M pods, sitting behind
> one public gateway. They share a session store and a common
> identity domain. When a user changes their password on the
> auth-service, every pod of every service must drop its cached
> identity for that user. When the catalog-service updates a product,
> every catalog-service pod must fan that change out to its WebSocket
> clients — but the order-service must not._

**Story:** P2 points every service at one shared broker. Each service
binds the adapter with a distinct `topicPrefix`. Identity events
carry through the gateway-fronted fleet. Entity changes stay scoped
to the service that owns the model. No service learns the others'
internal topics, but cross-service eavesdrop is one explicit method
call away when the use case is real.

### P3. Library author building a custom typed facade

> _I'm shipping a FuryStack package that needs cross-node
> coordination — feature-flag flips, config reloads, custom domain
> events. I want the same DX as `EventHub<T>` (typed event map, typed
> handlers) without rebuilding the transport plumbing._

**Story:** P3 defines a `MyFeatureBus` facade that wraps an internal
`EventHub<MyEvents>` and bridges it to `CrossNodeBus.publish` /
`CrossNodeBus.subscribe`. App consumers get the familiar `EventHub`
API; the framework owns the wire format.

## 6. Architecture overview

```
+-------------------------+   +-------------------+   +-----------------------+
| EntityChangeBus         |   | IdentityEventBus  |   | App-defined facades   |
| (entity-sync-service)   |   | (rest-service)    |   |                       |
| - sequencing            |   | - typed events    |   | - typed events        |
| - replay window         |   | - cache invalidn. |   | - app topics          |
+-----------+-------------+   +---------+---------+   +-----------+-----------+
            |                           |                         |
            +-----------+---------------+-------------+-----------+
                        |               |             |
                        v               v             v
            +-----------------------------------------------------+
            | @furystack/cross-node-bus (CrossNodeBus token)      |
            | publish(topic, msg) / subscribe(topic, h) / nodeId  |
            +---------------------------+-------------------------+
                                        |
                +-----------------------+-----------------------+
                |                                               |
                v                                               v
        InProcessCrossNodeBus                          Adapter packages
        (default factory)                              (separate npm packages)
                                                       e.g. @furystack/redis-cross-node-bus
```

- **`@furystack/cross-node-bus`** owns the abstraction: minimal
  `CrossNodeBus` interface, default `InProcessCrossNodeBus`, the DI
  token, and capability declarations. No transport-specific code
  lives in the core package.
- **Adapter packages** (`@furystack/redis-cross-node-bus`, future
  `-nats-`, `-kafka-`) live in their own publishable units with their
  own dependencies and own integration tests.
- **Subsystem facades** are typed, opinionated wrappers. Each owns its
  own concerns (sequencing, replay, cache invalidation logic) and
  consumes the shared `CrossNodeBus` token.
- **Apps may also use `CrossNodeBus` directly** for one-off coordination,
  but the recommended path is to define a facade per concern.

This mirrors how `defineStore` + `defineFileSystemStore` /
`defineRedisStore` are layered today.

### Multi-service deployment shape

The framework is designed for the **N services × M nodes per service**
deployment described by P2. A single broker serves the whole fleet;
every service binds its adapter with a distinct `topicPrefix`:

```ts
injector.bind(
  CrossNodeBus,
  defineRedisCrossNodeBusAdapter({
    topicPrefix: 'svc-a/',
    serviceName: 'svc-a',
  }),
)
```

Facades publish/subscribe under their own sub-namespace
(`identity/`, `entity/User`, `app/…`); the adapter prefixes every
topic with `topicPrefix` on the wire. Cross-service eavesdrop is
opt-in and explicit (see §8 _Cross-prefix subscribe_).

### `nodeId` convention

`nodeId = ${serviceName}-${random}` (random tail per process start).
Stable per process, unique across services, debuggable in telemetry.
The factory defaults to this when `serviceName` is provided to the
adapter; apps may override for tests.

## 7. API contract

### `CrossNodeBus` interface

```ts
export interface CrossNodeBus extends Disposable {
  /** Stable, unique id of this node. Included in every published message. */
  readonly nodeId: string

  /** Static description of what this adapter can do. */
  readonly capabilities: CrossNodeBusCapabilities

  /**
   * Publishes `payload` on `topic`. Returns once the message has been
   * accepted by the underlying transport (not when it has been delivered
   * to all subscribers).
   */
  publish(topic: string, payload: unknown): Promise<void>

  /**
   * Subscribes to every message published on `topic`, including ones
   * originating from this node. Subscribers must filter by `originId`
   * themselves if they want a local/remote distinction.
   */
  subscribe(topic: string, handler: (message: BusMessage) => void): Disposable

  /**
   * Convenience for the common "I only care about messages from other
   * nodes" pattern. Equivalent to subscribe + filter on
   * `message.originId !== this.nodeId`.
   */
  subscribeRemoteOnly(topic: string, handler: (message: BusMessage) => void): Disposable

  /**
   * Subscribe to a topic owned by another `topicPrefix`. Explicit, greppable
   * cross-service eavesdrop. Adapters that do not support cross-prefix
   * routing may throw at registration time.
   */
  subscribeForeign(prefix: string, topic: string, handler: (message: BusMessage) => void): Disposable

  /**
   * Replay messages on `topic` from `fromSeq` (exclusive) up to the most
   * recent. Throws synchronously if `bus.capabilities.replay` is
   * `false`. Throws (or yields an error on first iteration)
   * `ReplayWindowExceededError` if `fromSeq` is older than the
   * adapter's retained window — facades fall back to a full snapshot.
   */
  replay(topic: string, fromSeq: string): AsyncIterable<BusMessage>
}

export interface BusMessage {
  /** Wire-format version. Adapters refuse incompatible versions. */
  readonly v: 1
  /** `nodeId` of the publisher. */
  readonly originId: string
  /** ISO-8601 publish timestamp from the publisher's clock (diagnostic only). */
  readonly emittedAt: string
  /**
   * Adapter-assigned per-topic monotonic id. Optional because non-sequencing
   * adapters do not provide one.
   */
  readonly seq?: string
  /** Caller-supplied payload. Must be JSON-serializable. */
  readonly payload: unknown
}

export interface CrossNodeBusCapabilities {
  readonly persistent: boolean
  readonly replay: boolean
  readonly assignsSequence: boolean
}
```

Design choices:

- **Pure pub/sub.** No request/response.
- **Untyped wire format.** Typing is the facade's job; the wire stays
  flexible enough to host any payload shape.
- **`subscribe` returns a `Disposable`** for `using` / `useDisposable`
  ergonomics. Legacy `addListener` / `removeListener` parity is not
  exposed.
- **Self-delivery on by default.** Single fan-out path keeps publish
  and local subscriber semantics identical regardless of where the
  subscriber lives.
- **Hard pin on `BusMessage.v`.** See §12 for the rolling-deploy strategy.

### Token & default factory

```ts
export const CrossNodeBus = defineService({
  name: 'furystack/cross-node-bus/CrossNodeBus',
  lifetime: 'singleton',
  factory: () => new InProcessCrossNodeBus(),
})
```

If an app does not bind a transport adapter, `InProcessCrossNodeBus`
is used. Single-node deployments work out of the box with no
configuration. Multi-node deployments are expected to bind a real
adapter — in-process means "no cross-node delivery."

### Adapter factory helper

Adapters expose a `defineXxxCrossNodeBusAdapter` helper analogous to
`defineFileSystemStore` / `defineRedisStore`:

```ts
import { defineRedisCrossNodeBusAdapter } from '@furystack/redis-cross-node-bus'

injector.bind(
  CrossNodeBus,
  defineRedisCrossNodeBusAdapter({
    url: 'redis://redis:6379',
    topicPrefix: 'svc-a/',
    serviceName: 'svc-a',
    replayWindow: 10_000,
  }),
)
```

The helper validates config at construction time and centralizes the
lifecycle (`onDispose` cleanup). All configuration is **env-agnostic**
and constructor-passed; adapters never read `process.env` directly.

## 8. Adapters

| Adapter                  | Persistence        | Server seq | Replay | Setup cost          | `IdentityEventBus` | `EntityChangeBus` | First impl?                   |
| ------------------------ | ------------------ | ---------- | ------ | ------------------- | ------------------ | ----------------- | ----------------------------- |
| In-process               | n/a                | local      | yes\*  | none                | yes                | yes               | ✅ ships with the bus package |
| Redis Streams            | ✅                 | yes        | ✅     | low                 | yes                | yes               | ✅ first concrete adapter     |
| Redis pub/sub            | ❌                 | no         | ❌     | low                 | yes                | no                | maybe                         |
| NATS JetStream           | ✅                 | yes        | ✅     | medium              | yes                | yes               | later                         |
| Kafka                    | ✅                 | yes        | ✅     | high                | yes                | yes               | **out of v1**                 |
| RabbitMQ Streams         | ✅                 | yes        | ✅     | medium              | yes                | yes               | later                         |
| RabbitMQ (classic AMQP)  | ❌                 | no         | ❌     | low                 | yes                | no                | later                         |
| MQTT                     | ❌                 | no         | ❌     | low                 | yes                | no                | later                         |
| Postgres `LISTEN/NOTIFY` | ❌ (advisory only) | no         | ❌     | low (already in DB) | yes                | no                | later                         |

\* The in-process adapter is single-process by definition; "replay"
means the local ring buffer used by reconnecting clients.

Redis Streams is the recommended first concrete adapter — small ops
surface, native sequencing, native replay, easy local development with
docker-compose.

### Cross-prefix subscribe

`subscribe(topic, …)` resolves under the adapter's own `topicPrefix`.
Cross-service eavesdrop is supported via:

```ts
bus.subscribeForeign('auth-service/', 'identity/userLoggedOut', handler)
```

The method is deliberately verbose so that any cross-service coupling
shows up in `grep`. Adapters that lack the underlying capability must
throw a clear error at registration time.

### Replay-window defaults

| Adapter       | Default window                       | Configurable via               |
| ------------- | ------------------------------------ | ------------------------------ |
| In-process    | 1 000 messages / topic (ring buffer) | constructor `{ replayWindow }` |
| Redis Streams | `MAXLEN ~ 10000` per stream          | constructor `{ replayWindow }` |

Out-of-window replay throws (or yields on first iteration)
`ReplayWindowExceededError`; facades fall back to a full snapshot path.

## 9. Capability matrix & enforcement

Capabilities are **declared statically** by every adapter and
**asserted at facade registration time**. There is **no silent
degradation**: a facade that needs replay and is bound to a
non-replaying adapter must refuse to start.

| Facade              | Required capabilities                         |
| ------------------- | --------------------------------------------- |
| `IdentityEventBus`  | none — works on any adapter                   |
| `EntityChangeBus`   | `replay === true && assignsSequence === true` |
| App-defined facades | facade declares its own requirement           |

Hard refusal means a clearer ops experience: a misconfigured
deployment fails loudly at boot rather than serving stale data
forever.

## 10. Facade specs

### 10.1 `IdentityEventBus` (rest-service)

Closes the gap between local `HttpUserContext` events (which fire
only on the originating node) and cross-instance state. Collapses
the identity-staleness window from `userCacheTtlMs` (default 30 s)
to bus latency for sub-TTL freshness.

#### Event shapes

```ts
export type IdentityEvent =
  | { type: 'userLoggedOut'; sessionId: string }
  | { type: 'sessionInvalidated'; sessionId: string }
  | { type: 'userRolesChanged'; username: string }
  | { type: 'userDeleted'; username: string }
  | { type: 'passwordChanged'; username: string }
```

#### Facade interface

```ts
export interface IdentityEventBus extends Disposable {
  /** Publishes a typed identity event on the underlying bus. */
  publish(event: IdentityEvent): Promise<void>

  /**
   * Subscribes to a single event type. The handler receives the event
   * payload narrowed to the requested type. Returns a `Disposable`
   * that removes the listener on dispose.
   */
  subscribe<TType extends IdentityEvent['type']>(
    type: TType,
    handler: (event: Extract<IdentityEvent, { type: TType }>) => void,
  ): Disposable
}
```

The shape mirrors `EventHub<T>.subscribe` so consumers familiar with
`httpUserContext.subscribe('onLogout', …)` need no relearning. The
facade implementation composes an internal `EventHub` for typed
local dispatch and bridges it to `CrossNodeBus.publish` /
`CrossNodeBus.subscribe` under a fixed `identity/` topic prefix.

#### Wiring (publish side)

`HttpUserContext.cookieLogout` keeps its existing local emit, **and**
publishes to the bus:

```ts
public async cookieLogout(request, response): Promise<void> {
  const sessionId = this.getSessionIdFromRequest(request)
  // … existing cookie clearing + session-store removal …

  if (sessionId) {
    this.userCache.invalidate(sessionCacheKey(sessionId))
    void this.identityEventBus.publish({ type: 'userLoggedOut', sessionId })
  }
  this.emit('onLogout', undefined)
}
```

`sessionCacheKey(sessionId)` is the shared helper introduced in M0.2 —
producer (`cookie-auth-provider.getCacheKey`), local invalidation
(`HttpUserContext.cookieLogout`), and bus subscribers all derive the
same string from one source of truth.

The local `EventHub` emit is preserved — apps that already subscribe
to `httpUserContext` events keep working unchanged. Cross-node
fan-out is purely additive.

#### Wiring (subscribe side)

```ts
identityEventBus.subscribe('userLoggedOut', ({ sessionId }) => {
  userCache.invalidate(sessionCacheKey(sessionId))
})

identityEventBus.subscribe('sessionInvalidated', ({ sessionId }) => {
  userCache.invalidate(sessionCacheKey(sessionId))
})

identityEventBus.subscribe('userRolesChanged', ({ username }) => {
  userCache.invalidateByUser(username)
})

identityEventBus.subscribe('userDeleted', ({ username }) => {
  userCache.invalidateByUser(username)
})

identityEventBus.subscribe('passwordChanged', ({ username }) => {
  userCache.invalidateByUser(username)
})
```

#### `invalidateByUser`

`UserResolutionCache` keys by `cookie:${sessionId}`. Invalidate by
username via `Cache.removeByTag` against a `getTags`-derived
`user:${username}` tag:

```ts
type UserCacheTag = `user:${string}`

const cache = new Cache<User, [string], UserCacheTag>({
  load: (sessionId) => resolveSession(sessionId),
  getKey: (sessionId) => `cookie:${sessionId}`,
  getTags: (user) => [`user:${user.username}`],
})

public invalidateByUser(username: string): void {
  this.cache.removeByTag(`user:${username}`)
}
```

The tag is a plain string, so the same invalidation can be replayed
on every node by publishing `user:${username}` over the bus. Tag
matching uses the cache's reverse index — no per-call O(n) scan.

#### What does **not** propagate

- `onLogin` is intentionally **not** published. A cache populated for
  a fresh session is harmless on remote nodes; let TTL handle it.
- Bulk operations ("invalidate everything for tenant X") should
  publish a single high-level event rather than fanning out N
  per-user/per-session events.

### 10.2 `EntityChangeBus` (entity-sync-service)

Replaces `SubscriptionManager`'s direct `dataSet.subscribe(...)`
callbacks with a single fan-out path through the bus.

#### Wiring

```ts
dataSet.subscribe('onEntityAdded', ({ entity }) => {
  void this.entityChangeBus.publish(modelName, {
    type: 'added',
    entity,
    primaryKey: (entity as Record<string, unknown>)[primaryKey],
  })
})

const handle = this.entityChangeBus.subscribe(modelName, (change) => {
  this.handleBroadcastChange(modelName, change)
})
```

`handleEntityAdded` / `handleEntityUpdated` / `handleEntityRemoved`
become handlers on `EntityChange` events. Their existing logic
(build `ServerSyncMessage`, walk `this.subscriptions`, push to
sockets) stays as-is.

#### `EntityChange` payload

```ts
export type EntityChange =
  | { type: 'added'; entity: unknown; primaryKey: string }
  | { type: 'updated'; id: unknown; change: Record<string, unknown> }
  | { type: 'removed'; id: unknown }
```

The bus wraps it in `BusMessage` (versioning, originId, timestamp,
seq) — no need to duplicate any of that on the payload.

#### Sequence numbers

`registration.currentSeq` is per-process today. With multiple
nodes, each subscriber sees gaps and out-of-order deltas.

The chosen approach is **adapter-assigned sequence**: adapters that
support `assignsSequence` provide a server-assigned monotonic
`seq` per topic. The in-process adapter keeps a local counter
(matching today's behavior). `incrementVersion` moves out of
`SubscriptionManager` and into the broadcaster; the broadcaster
stamps `version: SyncVersion` on the outbound `ServerSyncMessage`
using the bus-assigned seq.

#### Server-side seq dedup

The bus is at-least-once; retransmits and reconnect-driven replay
can deliver the same `EntityChange` twice. The broadcaster tracks
`lastSeenSeq` per `(topic, originId)` and drops any
`seq <= lastSeenSeq` before pushing to local WS subscribers.

To prevent unbounded growth as nodes come and go, entries are
TTL-evicted after **1 hour of no messages** from that
`(topic, originId)`. Worst case after eviction = duplicate delivery
for that pair, which the rest of the system already tolerates.

#### Replay window

The per-process `changelog` in `SubscriptionManager` is dropped in
favor of `bus.replay` as the single source of truth.

- Reconnecting clients with a known last-seen seq → broadcaster calls
  `bus.replay(topic, fromSeq)`.
- The in-process adapter implements `replay` via a local ring buffer
  (1 000 messages per topic by default) — same data structure as
  today's `changelog`, owned by the bus.
- Adapters that don't support replay refuse to host
  `EntityChangeBus` at registration (capability assertion above), so
  the broadcaster can rely on `bus.replay` always being available.
- If the requested `fromSeq` is older than the bus's retained window,
  the broadcaster falls back to the existing full-snapshot path.

This removes the "covered by local changelog?" branching that hides
multi-node correctness bugs single-node tests can't catch — the
writing node's changelog is the only one that contains a write, so
any code path that prefers it skips writes from siblings.

### 10.3 App-defined facades

Apps build custom facades by composing an internal `EventHub<T>` (for
typed local DX and listener error isolation) with a `CrossNodeBus`
binding. Sketch:

```ts
type AppEvent = { type: 'featureFlagChanged'; flag: string; value: boolean } | { type: 'configReloaded' }

const APP_TOPIC = 'app/events'

export const AppEventBus = defineService({
  name: 'my-app/AppEventBus',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }) => {
    const bus = inject(CrossNodeBus)
    const local = new EventHub<{ event: AppEvent }>()

    const handle = bus.subscribe(APP_TOPIC, (message) => {
      local.emit('event', message.payload as AppEvent)
    })

    onDispose(() => {
      handle[Symbol.dispose]()
      local[Symbol.dispose]()
    })

    return {
      subscribe: (h: (e: AppEvent) => void) => local.subscribe('event', h),
      publish: (event: AppEvent) => bus.publish(APP_TOPIC, event),
    }
  },
})
```

This is the recommended pattern for any cross-node coordination an
app needs. A small `@furystack/cross-node-bus/testing` subpath ships
a two-instance in-process harness so facade authors can write
multi-node integration tests without spinning up a broker.

## 11. Cross-cutting concerns

### Delivery semantics

- **At-least-once**, not at-most-once. Entity-sync clients tolerate
  duplicates (state-snapshot diffing already deduplicates and the
  broadcaster does server-side dedup). Identity events are idempotent
  (invalidating an already-invalid entry is a no-op).
- **Per-topic FIFO from a given publisher** is sufficient. Total
  ordering across publishers is **not** required for any current
  consumer.

### Origin filter

The bus delivers a publisher's own messages back to it (single
fan-out path). Consumers that need to deduplicate local-vs-remote use
`message.originId === bus.nodeId`, or call
`subscribeRemoteOnly(...)`.

### Security

Adapters that talk to a network broker (Redis, NATS, Kafka) must
support TLS and authentication. The bus interface stays
transport-agnostic; the configuration lives on adapter constructors.

### Observability

Every publish/subscribe path emits structured events to
`ServerTelemetryToken`:

- `onCrossNodePublished` — `{ topic, originId, byteLength }`
- `onCrossNodeReceived` — `{ topic, originId, lagMs }`
- `onCrossNodeError` — `{ topic, error, phase: 'publish' | 'subscribe' | 'subscribeForeign' | 'replay' | 'serialize' }`

`lagMs = Date.now() - Date.parse(message.emittedAt)` and is emitted on
**every received message** — the cost is sub-microsecond and the
signal is invaluable when tuning replication paths.

`byteLength` is measured **after JSON serialization, before adapter
framing**, so values are comparable across adapters.

## 12. Backward compatibility

The bus is purely **additive** to existing surfaces:

- `HttpUserContext` keeps its local `EventHub`. Apps subscribed to
  `httpUserContext.subscribe('onLogout', …)` keep working unchanged.
  Bus publish sits next to the local emit, not in front of it.
- `DataSet.subscribe('onEntityAdded', …)` keeps working unchanged.
- Apps that do **not** bind a transport adapter resolve
  `InProcessCrossNodeBus` and behave exactly like today (single-node).

### Schema-version skew during rolling deploys

`BusMessage.v` is a hard pin: a v1 node and a v2 node sharing a topic
refuse each other's messages. The committed strategy for v1 is the
**dual-accept release cycle**:

1. Cycle N+1: ship a release that **accepts** both `v` and `v+1` but
   still **emits** `v`.
2. Cycle N+2: ship a release that **emits** `v+1`. Older nodes from
   N+1 still accept it.
3. Cycle N+3: drop `v` acceptance.

No fleet drain required. Pin the dual-accept window in release notes
when the first `v+1` lands.

### Internal API exports

Whether the `SubscriptionManager` refactor in `entity-sync-service`
is a major or minor bump depends on what the package's `index.ts`
re-exports. The implementer must check exports and bump accordingly.

## 13. Release plan & milestones

Numbered ordering implies prerequisites. Each milestone is mergeable
and releasable on its own.

### Milestone 0 — Pre-work (independent of bus)

These items land as standalone PRs **before** any bus code. Each is
independently valuable on `main` today and unblocks downstream
milestones. M0.1 + M0.2 are required to make Milestone 2 merge
cleanly. M0.3 + M0.4 are recommended but optional — skipping them
turns Milestone 3 into a chunkier diff but does not change the end
state.

- [ ] **M0.1 — Wire `getTags` into `UserResolutionCache`.** Widen the
      internal `Cache` generic from `Cache<User, [string]>` to
      `Cache<User, [string], \`user:${string}\`>` for typed-tag safety
      and add `getTags: (user) => [\`user:${user.username}\`]`to
    the constructor. Expose`invalidateByUser(username)`on the
   `UserResolutionCache`interface, backed by
   `cache.removeByTag(\`user:${username}\`)`. Useful in single-node
    deployments today (apps currently have no per-user
    invalidation short of `invalidateAll`) and is the hook
    `IdentityEventBus` consumes in Milestone 2.
- [ ] **M0.2 — Centralize identity cache-key / tag shape.** Extract
      the `cookie:${sessionId}` cache-key template and the
      `user:${username}` tag template into a small shared helpers
      module consumed by `cookie-auth-provider.getCacheKey`,
      `HttpUserContext.cookieLogout`, `UserResolutionCache`, and
      (later) `IdentityEventBus` subscribers. Prevents drift between
      local invalidation and bus-replicated invalidation.
- [ ] **M0.3 — Extract `SequenceGenerator` from `SubscriptionManager`.**
      Wrap the `incrementVersion` / `currentSeq++` logic behind an
      internal interface with `next(modelName): SyncVersion`. Default
      impl is the current per-registration counter. Turns Milestone 3's
      swap to bus-assigned sequence into a factory swap rather than
      scattered edits.
- [ ] **M0.4 — Extract `ChangeLog` from `SubscriptionManager`.** Wrap
      the `changelog` / `changelogRetentionMs` / `pruneChangelog`
      triple behind an interface (`append(entry)`,
      `since(fromSeq): AsyncIterable<entry>`). Default impl is the
      existing in-process ring + retention prune. Same swap pattern:
      Milestone 3 plugs in a `bus.replay`-backed impl.

### Milestone 1 — Bus core & in-process adapter

- [ ] Create `@furystack/cross-node-bus` package with the
      `CrossNodeBus` token, `BusMessage` type, capabilities,
      `InProcessCrossNodeBus` default factory.
- [ ] `subscribeRemoteOnly`, `subscribeForeign`, `replay` (ring buffer).
- [ ] Telemetry hooks (`onCrossNodePublished` /
      `onCrossNodeReceived` / `onCrossNodeError`).
- [ ] `@furystack/cross-node-bus/testing` subpath with a two-instance
      in-process harness.
- [ ] Unit tests covering subscribe/publish, multiple subscribers,
      disposal, originId, error isolation, replay window.

### Milestone 2 — `IdentityEventBus` facade (rest-service)

- [ ] Define event union + token + factory.
- [ ] Wire `HttpUserContext.cookieLogout` to publish.
- [ ] Subscribe in the factory: on `userLoggedOut` /
      `sessionInvalidated` invalidate the local
      `UserResolutionCache` entry; on `userRolesChanged` /
      `userDeleted` / `passwordChanged` call `invalidateByUser`
      (added in M0.1).
- [ ] Multi-node integration test (≥ 2 in-process bus instances)
      proving cross-node identity invalidation.
- [ ] (Stretch) on `userLoggedOut`, walk the
      `WebSocketApi.clients` map and close any sockets whose
      `request.headers.cookie` carries the invalidated `sessionId`.

### Milestone 3 — `EntityChangeBus` facade (entity-sync-service)

- [ ] Define `EntityChangeBus` interface + token (depends on
      `CrossNodeBus`).
- [ ] Refactor `SubscriptionManager.registerModel` to publish +
      subscribe via the broadcaster; single fan-out path.
- [ ] Swap the M0.3 `SequenceGenerator` factory to a bus-assigned
      impl; in-process bus keeps a local counter. (If M0.3 was
      skipped, this expands to inlined edits across `SubscriptionManager`.)
- [ ] Swap the M0.4 `ChangeLog` factory to a `bus.replay`-backed
      impl. (If M0.4 was skipped, this expands to dropping
      `changelog` / `pruneChangelog` and rewriting reconnection paths.)
- [ ] Server-side seq dedup with TTL eviction.
- [ ] Verify all existing tests pass — single-node story unchanged.
- [ ] Multi-node integration test (≥ 2 in-process bus instances)
      proving cross-node entity-change delivery and replay.

### Milestone 4 — Redis Streams adapter

- [ ] `@furystack/redis-cross-node-bus` package using Redis Streams
      (`XADD` / `XREAD` consumer groups for per-node delivery).
- [ ] Capability flags reflect persistence / replay / sequencing.
- [ ] Adapter constructor accepts `{ url, topicPrefix, serviceName, replayWindow }`;
      `nodeId` defaults to `${serviceName}-${random}`.
- [ ] Integration tests gated on `docker-compose up redis` (existing
      pattern).
- [ ] Manual smoke-test harness with two Node processes against a
      dockerized Redis verifies entity-sync + identity events
      end-to-end.

### Milestone 5 — Multi-service smoke test

- [ ] Two services × two nodes each, single Redis, distinct
      `topicPrefix` per service. Assertions:
  - Identity events published by service A's auth path invalidate
    caches on every node of service A and **only there**.
  - Service B sees nothing on its own subscriptions.
  - `subscribeForeign` from B to A's identity topic delivers
    correctly when explicitly opted in.
- [ ] All §4 success metrics measured and recorded.

## 14. Risks & mitigations

| Risk                                                                              | Severity | Mitigation                                                                                                                                       |
| --------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bus broker becomes a single point of failure                                      | high     | In-process adapter keeps working in degraded mode; `onCrossNodeError` telemetry alarms. Document SLO.                                            |
| Cold-start ordering on `IdentityEventBus`                                         | low      | Bounded by `UserResolutionCache` TTL (default 30 s). Documented behavior; fix would cost adapter-agnosticism.                                    |
| Schema-version skew during rolling deploys                                        | medium   | Dual-accept release cycle (§12). Pin window in release notes.                                                                                    |
| `lastSeenSeq` map growth as nodes churn                                           | low      | TTL eviction after 1 h idle per `(topic, originId)`.                                                                                             |
| Bursty models flooding the bus                                                    | medium   | Existing `debounceMs` / `queryTtlMs` knobs help. v1 commits to **coalesce-by-PK** semantics for any future per-model rate limit; **never drop**. |
| Large entity payloads on broadcast                                                | medium   | v1 ships full-entity broadcast. v1.x will add an opt-in `broadcastPayload` hook on `DataSetSettings`; documented workaround in the meantime.     |
| Capability mismatch between facade and adapter                                    | low      | Hard refusal at registration time; no silent degradation.                                                                                        |
| Two `EntityChangeBus` consumers seeing different snapshots after partial delivery | medium   | Adapter-assigned seq + replay + server-side dedup converge state on next message.                                                                |

## 15. Out of scope

- **Distributed locks** for write coordination (writes still go through
  the underlying store).
- **Cross-node WebSocket handover** ("clients on node A should keep
  their subscriptions when A drains"). Sticky load balancing is the
  assumed deployment shape for WS; HTTP traffic does **not** need to
  be sticky. Brief disconnects + the existing initial-snapshot path
  on reconnect cover state recovery.
- **Public gateway, gateway routing, gateway-as-bus-consumer.** App
  developers who need a gateway already implement specific solutions.
  Not a framework concern at this layer.
- **Auth-terminating gateway, signed identity headers, per-request
  token exchange.** The shared session store + per-service auth model
  already covers this.
- **Strongly-consistent state replication.** This is a notification
  bus, not a state machine — apps still own their persistent stores.
- **Discovery / membership / health.** The transport handles it; we
  don't need to know which nodes are up.
- **Telemetry / metrics aggregation.** Handled by
  `ServerTelemetryToken` consumers (Prometheus scrape, Datadog agent,
  etc.).
- **Application-level event sourcing.** Use a real event store
  (EventStoreDB, etc.); this bus is for notifications, not the source
  of truth.
- **Distributed job/work queues.** `CrossNodeBus` is fan-out only:
  every subscriber on every node receives every message. Competing-
  consumer dispatch with ack / visibility-timeout / dead-letter
  semantics is a different primitive. A future `@furystack/work-queue`
  package could share the same adapter packages (Redis Streams
  consumer groups, NATS JetStream pull consumers) but the API and
  delivery semantics are not interchangeable. The bus **is** the
  right tool for _broadcasting job status/progress and invalidating
  cached job state_ alongside such a queue.
- **Kafka adapter in v1.** Listed in §8 as a future option only.

## 16. Open questions

These are intentionally left for the implementer to settle during
development; none of them gate the v1 plan.

1. **Replay return type.** `replay(topic, fromSeq)` is specified as
   `AsyncIterable<BusMessage>`. Confirm Redis Streams' streaming
   semantics map cleanly; fall back to `Promise<BusMessage[]>` only
   if backpressure becomes an issue.
2. **`SubscriptionManager` exports.** Whether the refactor is a major
   or minor bump for `@furystack/entity-sync-service` depends on
   what `index.ts` re-exports — confirm during Milestone 3.
3. **In-process adapter ring-buffer eviction behavior on burst.** When
   a single topic exceeds 1 000 messages within the replay window,
   does the broadcaster surface a metric so operators tune up the
   window?
4. **Foreign-prefix subscribe authorization.** Should the Redis
   adapter guard `subscribeForeign` behind an explicit allow-list
   in adapter config, or trust the developer's intent?

## 17. Dependencies & related work

- **PR #639** — captured-identity refactor in `SubscriptionManager`
  (prerequisite: subscriptions must not retain the per-message
  WebSocket scope, so cross-node delivery on a captured-identity
  scope is well-defined). Status to be confirmed at Milestone 3 kickoff.
- **`feat/huc-ttl-cache`** — short-TTL user-resolution cache in
  `@furystack/rest-service`. Bounds cross-instance staleness for
  session/role changes; this PRD collapses that window further for
  the events where sub-TTL latency matters.
- **`@furystack/cache` tag-based invalidation (landed)** — the major
  release that removed the predicate-based `obsoleteRange` /
  `removeRange` in favor of `getTags` / `obsoleteByTag` /
  `removeByTag`. Tags are deliberately serializable so the same
  invalidation can be replayed over the bus. This is the prerequisite
  the M0.1 `UserResolutionCache.invalidateByUser` and the §10.1
  `IdentityEventBus` subscribers consume.
- **`docs/internal/functional-di-migration-plan.md`** — established
  the "interface + token + factory" pattern this PRD follows for
  the `CrossNodeBus` token, every facade, and every adapter
  helper.
- **`@furystack/utils` `EventHub<T>`** — facades compose an internal
  `EventHub` for typed local dispatch and listener error isolation.
  Internal `ListenerRegistry` extraction is optional; the
  `InProcessCrossNodeBus` may reuse `EventHub` directly if the
  duplication stays under ~30 LOC.
