<!-- version-type: patch -->

# @furystack/redis-task-runner

## ✨ Features

### Initial release — Redis Streams adapter for `@furystack/task-runner`

First publishable revision of the Redis-Streams-backed queue transport. Implements the `QueueAdapter` contract introduced by `@furystack/task-runner` so apps swap transports via a single `injector.bind`:

```typescript
import { createInjector } from '@furystack/inject'
import { TaskRunner } from '@furystack/task-runner'
import { defineRedisTaskRunner } from '@furystack/redis-task-runner'
import { createClient } from 'redis'

const client = createClient({ url: process.env.REDIS_URL })
await client.connect()

await using injector = createInjector()
injector.bind(TaskRunner, defineRedisTaskRunner({ client, serviceName: 'svc-a', topicPrefix: 'svc-a/' }))
```

Caller owns the `redis` client lifecycle; the adapter never closes it (same ownership rule as `@furystack/redis-cross-node-bus`).

### Per-`(type, handlerVersion)` stream sharding

Tasks are published to `${topicPrefix}tasks:queue:${type}:v${handlerVersion}`. Workers subscribe only to the shards whose `(type, version)` they support, eliminating claim-time version mismatches at the broker. Tag dimensions are dynamic per-worker registration and remain a claim-time concern.

### Broker-side visibility reclaim via `XAUTOCLAIM`

Each slot iteration runs `XAUTOCLAIM` first (idle threshold = the per-type `visibilityTimeoutMs`); reclaimed PEL entries flow through the same `onClaim` path as fresh messages, and the runner core finalizes the prior attempt as `'timed-out'` before starting a fresh one. `XCLAIM JUSTID` resets idle on `ctx.heartbeat` and on every coalesced `reportProgress` write.

### Cross-node idempotency lease via `SET NX EX`

`acquireIdempotencyLease({ type, key, taskId })` writes `${prefix}tasks:idem:${type}:${key} → taskId` with `NX EX 86400`. Concurrent submitters across nodes lose the race deterministically — the runner core returns the prior winner's task instead of duplicating the row.

### Capability declaration

| Capability            | Value   |
| --------------------- | ------- |
| `persistent`          | `true`  |
| `distributed`         | `true`  |
| `delayedDispatch`     | `false` |
| `fleetCapEnforcement` | `false` |
| `brokerSideReclaim`   | `true`  |

`delayedDispatch` and `fleetCapEnforcement` are intentionally `false` in this release; both land in follow-up PRs as described in `docs/internal/distributed-task-management.md` Milestone 3 implementation notes.

## 🧪 Tests

- Unit suite stubbing the `redis` client to verify XADD / XREADGROUP / XAUTOCLAIM / XACK / XCLAIM JUSTID / SET NX EX call shapes, BUSYGROUP idempotency, idempotency-lease race outcomes, and malformed-entry handling.
- Integration suite gated on `docker-compose up redis` covering submit/claim/complete, two-worker no-double-execute, broker-side reclaim, draft/start two-phase, and cancel-broadcast.
