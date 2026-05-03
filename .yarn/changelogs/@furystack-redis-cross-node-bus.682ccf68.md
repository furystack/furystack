<!-- version-type: major -->

# @furystack/redis-cross-node-bus

## 💥 Breaking Changes

### Initial 1.0.0 release

First public release of `@furystack/redis-cross-node-bus` — the production-grade Redis Streams adapter for `@furystack/cross-node-bus`. There is no migration path from a previous version because none exists; this section is required by the major-release contract.

## ✨ Features

### Redis Streams adapter for `CrossNodeBus`

A `defineRedisCrossNodeBusAdapter({ ... })` helper that overrides the default in-process `CrossNodeBus` binding with a Redis-Streams-backed transport. Drop-in for the same `CrossNodeBus` token — facades (`IdentityEventBus`, `EntityChangeBus`, app-defined wrappers) require no changes when switching from in-process to Redis.

```typescript
import { CrossNodeBus } from '@furystack/cross-node-bus'
import { defineRedisCrossNodeBusAdapter } from '@furystack/redis-cross-node-bus'
import { createClient } from 'redis'

const client = createClient({ url: 'redis://localhost:6379' })
await client.connect()

injector.bind(
  CrossNodeBus,
  defineRedisCrossNodeBusAdapter({
    client,
    serviceName: 'my-app',
    topicPrefix: 'my-app/',
    replayWindow: 10_000,
  }),
)
```

The caller owns the supplied client's `connect` / `quit` lifecycle (mirrors `@furystack/redis-store`); the adapter `.duplicate()`s the client internally for the blocking `XREAD` consumer loop and quits the duplicate via `onDispose`.

### Adapter capabilities

- `persistent: true` — messages survive process restarts as long as the stream is retained.
- `replay: true` — `replay(topic, fromSeq)` walks the stream forward via `XRANGE` and yields `BusMessage`s up to the current tail.
- `assignsSequence: true` — every message carries the native Redis Stream id (`<ms>-<n>`) as its `seq`. `compareSeq` orders ids by the parsed `<ms>` first then `<n>` so facades never have to know the encoding.

### Replay-window management

`replayWindow` (default 10 000 per topic) controls retention via `XADD ... MAXLEN ~ N`, capping memory and bounding the window in which delta-sync is feasible. When a consumer asks to `replay()` from a seq older than the trimmed range the adapter throws `ReplayWindowExceededError`, so facades fall back to a full snapshot.

### Multi-service smoke harness

`multi-service-smoke.spec.ts` runs two simulated services (each with multiple in-process nodes) against a shared Redis instance and asserts:

- Cross-node fan-out within a service.
- Topic isolation across services (no leaks unless `subscribeForeign` is used).
- Reconnect-with-`lastSeq` replays the gap.
- `subscribeForeign` opt-in delivers cross-service traffic.

The harness is gated on `docker-compose up redis` the same way `@furystack/redis-store` integration tests are.
