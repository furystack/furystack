# @furystack/redis-task-runner

Redis Streams adapter for [`@furystack/task-runner`](../task-runner). Backs
multi-node task execution with persistent, broker-side-reclaimable consumer
groups. See `docs/internal/distributed-task-management.md` Milestone 3 for
the full design.

## Installation

```bash
npm install @furystack/redis-task-runner
# or
yarn add @furystack/redis-task-runner
```

## Usage

The caller owns the `redis` client lifecycle (`connect` / `quit`) — same as
[`@furystack/redis-cross-node-bus`](../redis-cross-node-bus) and
[`@furystack/redis-store`](../redis-store).

```ts
import { createInjector } from '@furystack/inject'
import { BlobStore } from '@furystack/blob-store'
import { CrossNodeBus } from '@furystack/cross-node-bus'
import { defineRedisCrossNodeBusAdapter } from '@furystack/redis-cross-node-bus'
import { defineS3BlobStore } from '@furystack/s3-blob-store'
import { TaskRunner } from '@furystack/task-runner'
import { defineRedisTaskRunner } from '@furystack/redis-task-runner'
import { createClient } from 'redis'

const client = createClient({ url: process.env.REDIS_URL })
await client.connect()

await using injector = createInjector()
injector.bind(CrossNodeBus, defineRedisCrossNodeBusAdapter({ client, serviceName: 'svc-a' }))
injector.bind(BlobStore, defineS3BlobStore({ client: s3Client, bucket: 'svc-a-blobs' }))
injector.bind(
  TaskRunner,
  defineRedisTaskRunner({
    client,
    serviceName: 'svc-a',
    topicPrefix: 'svc-a/',
    visibilityTimeoutMs: 60_000,
  }),
)

const runner = injector.get(TaskRunner)

// shutdown
await injector[Symbol.asyncDispose]()
await client.quit()
```

## Stream layout

| Key                                               | Purpose                                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `${prefix}tasks:queue:${type}:v${handlerVersion}` | One stream per `(type, version)` lane. XADD on enqueue.                       |
| `${prefix}tasks:idem:${type}:${idempotencyKey}`   | `SET NX EX` idempotency-lease key.                                            |
| `${prefix}tasks:scheduler`                        | Single ZSET parking delayed tasks until their `notBefore` (members are JSON). |

A single consumer group named `runner` (override via `consumerGroup`) joins
every lane. Each registered worker spawns `concurrency` slots; slot consumers
are named `${workerId}-slot-${index}`.

## Capabilities

| Capability            | Value   | Notes                                                                          |
| --------------------- | ------- | ------------------------------------------------------------------------------ |
| `persistent`          | `true`  | Streams survive broker restarts (configure broker durability separately).      |
| `distributed`         | `true`  | Consumer-group competing-consumer dispatch across nodes.                       |
| `delayedDispatch`     | `true`  | Scheduler ZSET + Lua atomic-pop dispatcher; `notBefore` honored at the broker. |
| `fleetCapEnforcement` | `false` | Lua-atomic fleet caps land in a follow-up.                                     |
| `brokerSideReclaim`   | `true`  | `XAUTOCLAIM` recovers stale PEL entries past the visibility timeout.           |

## Delayed dispatch

Tasks submitted with a future `notBefore` are parked in a single global
`${prefix}tasks:scheduler` ZSET (member = JSON `{taskId, type, handlerVersion}`,
score = epoch ms). Every adapter instance ticks a 250 ms scheduler that
evaluates a short Lua script atomically popping due entries and
`XADD`ing them onto the matching `(type, version)` stream. Lua atomicity
(the `ZREM` inside the script) prevents two adapter instances from
double-dispatching the same delayed task.

Tune the tick rate via `schedulerIntervalMs` — lower = lower delay
jitter at the cost of broker chatter; higher = looser floor on
`notBefore` precision.

## Visibility & reclaim

Each slot iteration runs `XAUTOCLAIM` first (idle threshold = the
type-specific `visibilityTimeoutMs`); reclaimed entries are delivered through
the same `onClaim` path as fresh ones. The runner core marks the prior
in-progress attempt as `'timed-out'` before starting a fresh attempt — handlers
that observe `ctx.attempt > 1` see the same payload as attempt 1 (replay log
keyed by `(taskId, stepIndex)` dedups recorded steps).

`heartbeat()` resets the broker-side idle counter via `XCLAIM JUSTID`. Hot-lane
progress reports (`ctx.reportProgress`) implicitly heartbeat via the runner
core's coalesced dataset write — handlers reporting progress regularly stay
under the visibility threshold automatically.

## Constructor options

| Option                    | Type     | Default    | Notes                                                 |
| ------------------------- | -------- | ---------- | ----------------------------------------------------- |
| `client`                  | required | —          | Caller-owned `redis` client. Must be connected.       |
| `serviceName`             | required | —          | Telemetry attribution.                                |
| `topicPrefix`             | optional | `''`       | Wire prefix for every stream / lease / scheduler key. |
| `consumerGroup`           | optional | `'runner'` | Group name. Override only when sharing a broker.      |
| `visibilityTimeoutMs`     | optional | `60_000`   | Default reclaim threshold per task lane.              |
| `visibilityTimeoutByType` | optional | `{}`       | Per-type override (`{ 'video-encode': 600_000 }`).    |
| `blockTimeoutMs`          | optional | `200`      | `XREADGROUP BLOCK` timeout.                           |
| `retryBackoffMs`          | optional | `250`      | Backoff between reads after broker errors.            |
| `idempotencyTtlSec`       | optional | `86_400`   | `SET NX EX` lease TTL.                                |
| `schedulerIntervalMs`     | optional | `250`      | Delayed-dispatch scheduler tick interval.             |

## Integration tests

`src/redis-task-runner.integration.spec.ts` exercises submit/claim/complete,
two-worker no-double-execute, broker-side reclaim, draft/start two-phase,
and cancel-broadcast against a real broker reachable at `REDIS_URL`
(default `redis://localhost:6379`). CI brings it up via `docker compose up -d`.
