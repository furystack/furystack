# @furystack/redis-cross-node-bus

Redis Streams adapter for [`@furystack/cross-node-bus`](../cross-node-bus). Backs
multi-node deployments with persistent, sequenced, replayable cross-process
pub/sub.

See `docs/internal/cross-node-bus-spike.md` for the full design.

## Installation

```bash
npm install @furystack/redis-cross-node-bus
# or
yarn add @furystack/redis-cross-node-bus
```

## Usage

The caller owns the `redis` client lifecycle (`connect` / `quit`) — same as
[`@furystack/redis-store`](../redis-store). The adapter `.duplicate()`s the
client internally for the blocking `XREAD` consumer loop and quits the
duplicate on dispose.

```ts
import { createInjector } from '@furystack/inject'
import { CrossNodeBus } from '@furystack/cross-node-bus'
import { defineRedisCrossNodeBusAdapter } from '@furystack/redis-cross-node-bus'
import { createClient } from 'redis'

const client = createClient({ url: process.env.REDIS_URL })
await client.connect()

await using injector = createInjector()
injector.bind(
  CrossNodeBus,
  defineRedisCrossNodeBusAdapter({
    client,
    serviceName: 'svc-a',
    topicPrefix: 'svc-a/',
    replayWindow: 10_000,
  }),
)

const bus = injector.get(CrossNodeBus)

using sub = bus.subscribe('events', (message) => {
  console.log(message.originId, message.payload)
})

await bus.publish('events', { hello: 'world' })

// shutdown
await injector[Symbol.asyncDispose]()
await client.quit()
```

### Capabilities

| Capability        | Value  |
| ----------------- | ------ |
| `persistent`      | `true` |
| `replay`          | `true` |
| `assignsSequence` | `true` |

`seq` tokens are Redis stream IDs (`<ms>-<seq>`). Use the bus's
`compareSeq` for ordering — never compare them as strings or numbers
directly.

### Constructor options

| Option         | Type     | Default                    | Notes                                                        |
| -------------- | -------- | -------------------------- | ------------------------------------------------------------ |
| `client`       | required | —                          | Caller-owned `redis` client. Must be connected before use.   |
| `serviceName`  | required | —                          | Used in the default `nodeId` and for telemetry attribution.  |
| `topicPrefix`  | optional | `''`                       | Prefix applied to every wire topic.                          |
| `replayWindow` | optional | `10_000`                   | Approximate `MAXLEN ~` per stream — Redis trims around this. |
| `nodeId`       | optional | `${serviceName}-${random}` | Override for tests or deterministic ids.                     |

### Cross-process smoke test

`src/cross-process-smoke.spec.ts` (PRD M4) forks four worker processes (two
services × two nodes) against the same Redis CI uses for the rest of the
adapter integration suite, and asserts the four end-to-end scenarios:
identity invalidation, entity-sync delivery with bus-stamped seq,
replay-after-restart, and `subscribeForeign` opt-in.

The spec runs as part of `yarn test` whenever Redis is reachable at
`REDIS_URL` (default `redis://localhost:6379`). Children fork the package's
compiled output, so locally you must `yarn workspace @furystack/redis-cross-node-bus build`
once before running the spec in isolation; CI's `yarn build` step covers
this automatically.

Set `SMOKE_VERBOSE=1` for IPC tracing.
