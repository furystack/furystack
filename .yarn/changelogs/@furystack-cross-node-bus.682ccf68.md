<!-- version-type: major -->

# @furystack/cross-node-bus

## 💥 Breaking Changes

### Initial 1.0.0 release

First public release of `@furystack/cross-node-bus` — a transport-agnostic publish/subscribe primitive for FuryStack apps that scale beyond a single process. There is no migration path from a previous version because none exists; this section is required by the major-release contract.

## ✨ Features

### `CrossNodeBus` — shared, typed, multi-node event bus

A pluggable pub/sub primitive that lets every subsystem coordinate across nodes via the same shared facade. Subsystems and apps build typed wrappers (e.g. `IdentityEventBus`, `EntityChangeBus`) on top of one bus instance per injector tree.

```typescript
import { CrossNodeBus } from '@furystack/cross-node-bus'

const bus = injector.get(CrossNodeBus)
using sub = bus.subscribe('my-topic', ({ payload, originId }) => {
  console.log('received', payload, 'from', originId)
})
await bus.publish('my-topic', { hello: 'world' })
```

Self-delivery is on by default: a publisher receives its own messages. Subscribers that only care about sibling traffic use `subscribeRemoteOnly(topic, handler)`.

### In-process default adapter

`CrossNodeBus` resolves to an in-process implementation by default — single-node deployments work without any configuration. The default adapter:

- Assigns numeric monotonic seq tokens per topic.
- Retains the last 1 000 messages per topic for replay.
- Implements `replay`, `oldestSeq`, and `compareSeq` so facades can do delta sync against the in-process bus the same way they would against Redis.

Multi-node deployments override the binding with a transport adapter (see `@furystack/redis-cross-node-bus`).

### Capability flags + fail-loud registration

Every adapter exposes a `capabilities` descriptor (`persistent`, `replay`, `assignsSequence`). Facades assert the flags they need at registration time so misconfigured deployments fail loudly rather than serving stale data.

```typescript
const bus = injector.get(CrossNodeBus)
if (!bus.capabilities.replay) {
  throw new Error('This facade requires replay-capable transport')
}
```

### `replay()` + `compareSeq()` + `oldestSeq()` for delta sync

Adapters that retain a window of past messages let consumers reconnect with a `lastSeq` and replay just the gap. `compareSeq` lets facades order seq tokens without leaking the adapter-specific encoding (in-process: integer counters; Redis Streams: `<ms>-<n>`). When the requested seq predates the retained window, `replay()` throws `ReplayWindowExceededError` so facades fall back to a snapshot.

### `subscribeForeign()` for explicit cross-service eavesdrop

Cross-service traffic is opt-in and greppable: a service that wants to observe another service's topic prefix calls `subscribeForeign(prefix, topic, handler)`. Adapters that lack the underlying capability throw at registration time. There is no implicit cross-service fan-out.

### Test helper: `createInProcessBusNetwork`

Exposed under `@furystack/cross-node-bus/testing`. Mints N in-process `CrossNodeBus` instances backed by a single shared `MemoryBroker`, so multi-node behaviour can be unit-tested without spinning up a real broker:

```typescript
import { createInProcessBusNetwork } from '@furystack/cross-node-bus/testing'

using network = createInProcessBusNetwork({ count: 3 })
const [a, b, c] = network.buses
// a.publish(...) is observed by b and c
```

### Telemetry hooks

`CrossNodeBusTelemetry` emits `onCrossNodePublished`, `onCrossNodeReceived`, `onCrossNodeError`, and `onCrossNodeWindowEvicted` events with `topic`, `originId`, `byteLength` / `lagMs` / error-and-phase / eviction context — wire it into existing logging without touching adapter code. The shared sink is exposed via `CrossNodeBusTelemetryToken` so adapter factories (in-process or transport-specific) inject the same hub.

`onCrossNodeWindowEvicted` only fires for adapters that own their replay buffer (the in-process default today). Network-broker adapters that delegate trimming to the broker — Redis Streams' `MAXLEN`, NATS JetStream's max-bytes — cannot observe individual evictions on the client side; consumers needing that signal should read it from the broker's native metrics.
