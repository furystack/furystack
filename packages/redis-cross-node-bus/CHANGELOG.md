# Changelog

## [1.0.1] - 2026-06-05

### 👷 CI

- Raised the minimum supported Node.js to `>=24.0.0` (Node 24 LTS) in `engines`, dropping Node 22.

### ⬆️ Dependencies

### Upgraded `redis` to v6

Bumped `redis` from `^5.12.1` to `^6.0.0`. node-redis v6 defaults to the RESP3 protocol and adds a 5s default `commandTimeout`. The adapter relies on Redis Streams (`XADD` / `XREAD`), not pub/sub, and its blocking `XREAD` loop uses a 200ms `BLOCK` — well within the new timeout — so the upgrade is transparent for consumers.

- Bumped dev `vitest` to `^4.1.8`.

### ♻️ Refactoring

- Typed the `client` option (`RedisCrossNodeBusOptions['client']`) via redis's exported `RedisClientType` alias instead of `ReturnType<typeof createClient>`, which no longer matches a real `createClient({ url })` result under redis v6's RESP3-defaulted generics. Callers passing a connected `createClient(...)` instance are unaffected.

### ✨ Features

### Declares `crossNodeDelivery: true`

`RedisCrossNodeBus` now reports the new `crossNodeDelivery: true` capability (added to `CrossNodeBusCapabilities` in `@furystack/cross-node-bus`), so the task runner's boot-time capability cross-check recognizes it as a valid transport for multi-node deployments.

## [1.0.0] - 2026-05-21

### 💥 Breaking Changes

### Initial 1.0.0 release

First public release of `@furystack/redis-cross-node-bus` — the production-grade Redis Streams adapter for `@furystack/cross-node-bus`. There is no migration path from a previous version because none exists; this section is required by the major-release contract.

### ✨ Features

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

### ⬆️ Dependencies

- Bumped `@types/node` to `^25.9.1` and `vitest` to `^4.1.7`. No source changes — dev-tooling bump only.
