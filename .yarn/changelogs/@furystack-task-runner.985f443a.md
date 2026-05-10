<!-- version-type: minor -->

# @furystack/task-runner

## ✨ Features

### `QueueAdapter` abstraction extracted from the runner

The runner is now split into a transport-agnostic `TaskRunnerCore` (lifecycle, replay, retry, cancel cascade, parent wake, telemetry, lock chain) and a `QueueAdapter` interface (`enqueue`, `subscribe`, `heartbeat`, optional `acquireIdempotencyLease`). `InProcessTaskRunner` keeps its existing public surface as a thin subclass that pre-binds an in-process adapter; new transport packages (e.g. `@furystack/redis-task-runner`) extend `TaskRunnerCore` with their own adapter.

```typescript
import {
  TaskRunnerCore,
  type QueueAdapter,
  type WorkerSubscription,
  type ClaimedTask,
  type ClaimOutcome,
} from '@furystack/task-runner'
```

### `InProcessQueueAdapter` exposed publicly

`InProcessQueueAdapter` is the in-process implementation of `QueueAdapter`. Apps that need to compose a custom `TaskRunnerCore` (for example, mixing in custom telemetry wiring) can reuse it directly:

```typescript
import { InProcessQueueAdapter, TaskRunnerCore } from '@furystack/task-runner'

const queueAdapter = new InProcessQueueAdapter()
const core = new TaskRunnerCore({ injector, bus, blobStore, taskDs, replayDs, telemetry, queueAdapter })
```

### Optional `QueueAdapter.acquireIdempotencyLease(input)`

Adapters can implement a cross-node atomic idempotency-lease hook. When set, `submit({ idempotencyKey })` consults the adapter before persisting a new task — losing the race returns the prior winner's task instead of inserting a duplicate row. The in-process adapter implements the hook with a `Map`; the new Redis adapter uses `SET NX EX`.

### Broker-side reclaim flag

`QueueAdapterCapabilities.brokerSideReclaim` controls the runner core's dataset-driven visibility sweep — adapters with `brokerSideReclaim: true` (e.g. Redis with `XAUTOCLAIM`) handle stale-claim recovery themselves; the runner skips the sweep and reclaims through the adapter's own claim path. The runner core finalizes the prior in-progress attempt as `'timed-out'` and starts a fresh attempt automatically.

### `submit({ notBefore })` rejected against incapable adapters

`TaskRunnerCore.submit` and `start` now throw at submit time when `notBefore` is set against a `QueueAdapter` whose `capabilities.delayedDispatch` is `false`. Misconfigurations fail loudly rather than silently dispatching tasks immediately.

## 🐛 Bug Fixes

### `ctx.sleep` no longer ignores cancellation when the signal is already aborted

Handlers that called `await ctx.sleep(60_000)` after the cancellation signal had already aborted (a possible race when cancel cascade fires during the claim transition) would wait the full duration instead of cancelling immediately. The `sleep` wrapper now checks `signal.aborted` synchronously at entry and rejects without arming `setTimeout`.

### Cancel cascade vs. claim transition race

The cancel cascade and the claim transition now both run inside the per-task lock chain. Without serialization, a cascade observing status `'running'` between the claim transition's status update and the AbortController install would write `'cancelled'` directly while the handler kept running. The lock guarantees the cascade either sees the AC and aborts the running attempt, or sees no AC and finalizes the row terminal.

## ♻️ Refactoring

### `TaskRunnerCore` is the new shared base class

Most of the previous `InProcessTaskRunner` body moved to `TaskRunnerCore` so concrete runner implementations can share lifecycle code. `InProcessTaskRunner` retains its constructor signature and is still the entrypoint for in-process deployments — apps should not need to migrate, but advanced consumers can compose `TaskRunnerCore` against a custom `QueueAdapter` directly.
