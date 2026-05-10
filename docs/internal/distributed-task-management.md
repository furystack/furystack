# PRD: `@furystack/task-runner` + `@furystack/blob-store` — distributed task management

> **Status:** Draft v1.
> **Owner:** FuryStack core team.
> **Target release:** follows `@furystack/cross-node-bus` v1 (sibling primitive
> referenced as a prerequisite throughout this doc). Initial public packages
> alongside the next minor cycle of `@furystack/rest-service` and
> `@furystack/entity-sync-service`.
> **Companion doc:** [`cross-node-bus-spike.md`](./cross-node-bus-spike.md).

## 1. Glossary

| Term                     | Meaning                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Task**                 | A persisted unit of work with typed payload, status, progress, and result. Identified by an opaque `taskId`.                         |
| **Task type**            | String discriminator (e.g. `video-encode-h264`) selecting the handler that runs the task.                                            |
| **Handler**              | Async function authored with `defineTaskHandler` that executes a task type. Replay-safe (see §7).                                    |
| **Worker**               | A `defineWorker` instance hosted by an injector. Pulls claims for a configured set of task types, runs handlers, reports outcomes.   |
| **Runner**               | The `TaskRunner` abstraction: claim/ack/heartbeat/reclaim plumbing. Owns task lifecycle.                                             |
| **Queue adapter**        | Concrete transport-backed implementation of `TaskRunner`'s claim/ack pipeline (in-process, Redis Streams, …).                        |
| **Blob**                 | An opaque byte stream identified by a `key`. Stored in a `BlobStore` adapter. Tasks reference blobs by `BlobRef`.                    |
| **Blob store**           | The `BlobStore` abstraction in `@furystack/blob-store`. Adapter packages provide concrete backends (in-memory, filesystem, S3).      |
| **Parent / child**       | Task that uses `ctx.spawnChild(...)` becomes a parent; spawned tasks are children. DAG cycles are forbidden.                         |
| **Replay**               | Re-execution of a handler from its start when its task is resumed (after waiting for children, after a worker crash). See §7.        |
| **Continuation**         | Resumed run of a parent task after one or more children terminated. Driven by replay.                                                |
| **Visibility timeout**   | Wall-clock window during which a claimed task is invisible to other workers. Missed heartbeat past the window → task is reclaimable. |
| **Sweeper**              | Background service that deletes blobs belonging to terminal tasks past their retention TTL.                                          |
| **Fleet cap**            | Broker-enforced fleet-wide max-concurrent count for a `(type, tags)` lane.                                                           |
| **Idempotency key**      | Optional caller-supplied string deduplicating submissions of the same logical task across retries.                                   |
| **Resume token**         | Internal reference used by the runner to re-enqueue a parent for continuation. Apps never see it.                                    |
| **`handlerVersion`**     | Number recorded on a task at submit time, used to route the task to a worker that declares compatibility.                            |
| **Hot lane / Cold lane** | Two complementary progress channels: bus fan-out (hot, ephemeral) and dataset writes (cold, persisted, coalesced).                   |
| **Cross-node bus**       | The fan-out primitive defined in `cross-node-bus-spike.md`. The runner publishes status/progress on it; it is **not** the queue.     |

## 2. Problem & motivation

FuryStack apps deployed at scale need to run long, expensive, or
network-bound work outside the request/response path: video encoding,
image processing, document generation, batch ETL, scheduled
maintenance, third-party API fan-out. Today the framework provides no
primitives for this; every app builds something ad hoc, usually one of:

| Ad-hoc pattern                              | Shortcomings                                                                                                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `setImmediate` / fire-and-forget in handler | Lost on crash, no progress visibility, ties up the request worker, scales only with replicas.                                 |
| In-memory queue (`p-queue`, hand-rolled)    | No persistence, no cross-node distribution, no retry, no observability.                                                       |
| BullMQ / similar third-party                | Works, but bypasses the FuryStack DI graph, identity, telemetry, datasets — every app re-integrates and bug surfaces diverge. |
| Cron + ad-hoc HTTP                          | No persistent state, no progress, no fan-in, no idempotency.                                                                  |

Concretely: an app that runs video encoding today must hand-build (1)
upload of large input files, (2) a queue that survives crashes, (3) a
worker pool, (4) progress reports surfacing to the UI, (5) cancellation,
(6) cleanup of intermediate artifacts, (7) authorization on
inputs/outputs, (8) DAG composition (probe → split → encode chunks →
mux), (9) retries and dead-letter handling. None of these are
business-specific, and the resulting code is opaque to FuryStack's
observability, dataset, and identity primitives.

The cross-node bus PRD explicitly carves competing-consumer dispatch
out of scope (see `cross-node-bus-spike.md` §15) and forecasts a sibling
package. This PRD is that sibling, plus the blob-storage abstraction it
needs to handle large binaries cleanly.

Without first-party primitives, FuryStack apps at scale cannot run
non-trivial async work without quietly losing correctness on every one
of the columns above.

## 3. Goals & non-goals

### Goals

- Provide a single, transport-agnostic primitive (`@furystack/task-runner`) that
  every FuryStack subsystem and application can use to submit, run, and
  observe distributed tasks.
- Provide a single, transport-agnostic primitive (`@furystack/blob-store`) for
  storing and retrieving large binaries by key, with streaming and
  pre-signed URL support.
- Persist task state in a `defineDataSet` over `defineStore` so apps reuse
  every existing store adapter and get entity-sync subscriptions for free.
- Support DAG composition via dynamic `spawnChild` / `awaitChildren` from
  inside handlers, expressed as one model (static chains are sugar).
- Ship usable in-process defaults plus production-grade Redis Streams
  (queue) and S3-compatible (blob) adapters in v1.
- Enforce cross-adapter capability requirements at registration time so
  multi-node misconfigurations fail loudly at boot.
- Reuse the cross-node bus for low-latency progress fan-out so progress
  reports do not hammer the persistent store.

### Non-goals

- Replace persistent stores or become an event-sourcing primitive.
- Become a workflow orchestration platform (Temporal, Step Functions).
  The runner provides DAG composition but not workflow definitions,
  saga compensation primitives, or human-task signals (see §15).
- Provide cron / recurring scheduling in v1 (delayed `notBefore` is in;
  cron is out — apps build cron on top by submitting from a scheduler).
- Provide priority lanes, quota management, or fair scheduling in v1.
- Provide progressive / streaming output during task execution (HLS-style
  partial result streaming is composable from primitives but not a
  first-class concept — see §15).
- Sandbox handler determinism with VM isolates (Temporal-grade sandboxing
  is out — see §11).
- Solve cross-region replication, distributed locks for shared resources,
  or strongly-consistent state replication (see §15).

## 4. Success metrics

The v1 release is "done" when these numbers hold in the smoke test
harness described in §13.

| Metric                                                                 | Target               |
| ---------------------------------------------------------------------- | -------------------- |
| p95 submit-to-claim latency, in-process queue                          | **< 5 ms**           |
| p95 submit-to-claim latency, local Redis Streams queue                 | **< 50 ms**          |
| p95 progress event delivery (worker → subscribed client), Redis bus    | **< 100 ms**         |
| p99 visibility-timeout reclaim latency past `visibilityTimeoutMs`      | **< 1 s**            |
| Fan-in correctness in DAG smoke test (parent sees all child results)   | **0 drops, 0 dupes** |
| Multi-node integration: shutdown of any node mid-task → task completes | **100 %**            |
| Blob upload throughput, S3 adapter, single client, 1 GiB file          | **≥ 100 MiB/s**      |

Coverage gates:

- In-process queue adapter: 100 % line coverage.
- In-memory + filesystem blob-store adapters: 100 % line coverage.
- Replay/continuation logic: 100 % branch coverage on parent-resume,
  child-failure, child-cancellation, mid-spawn crash.
- S3 blob-store adapter: integration tests gated on a docker-compose
  MinIO instance, mirroring `redis-store` / `mongodb-store` patterns.
- Redis Streams queue adapter: integration tests gated on
  `docker-compose up redis`.
- **Multi-node integration tests with ≥ 2 worker processes** are
  mandatory for: claim concurrency, fleet cap enforcement, visibility
  reclaim, DAG fan-out/fan-in, graceful drain.

## 5. Personas & user stories

### P1. App developer running a media SaaS

> _Users upload videos. Each upload must be probed, transcoded into
> three resolutions in parallel, packaged for HLS, and a thumbnail
> generated. Encoding is GPU-bound; only four jobs may run at once
> across the fleet. Users want a live progress bar and a cancel button.
> Failures must retry once with backoff, then surface to the user._

**Story:** P1 defines four task types (`probe`, `encode`, `package`,
`thumbnail`). The submit endpoint creates a parent `process-upload` task
whose handler spawns probe → spawns three encode children + thumbnail
child in parallel → spawns package on encode results. The Shades UI
subscribes to progress over WS. The encoding workers run as standalone
pods with GPU access; web pods run no encoding workers. A fleet cap of
4 on `encode` prevents GPU thrash. Submit endpoint returns presigned
upload URLs; clients PUT directly to S3.

### P2. App developer running a B2B document platform

> _Generating a 200-page PDF report can take minutes. The app server
> must not block on it. Users want to download the result later from
> their dashboard, optionally getting an email when ready. Reports are
> regenerated nightly from updated source data._

**Story:** P2 submits a `generate-report` task on user request,
returning the `taskId` immediately. The dashboard subscribes to that
task over the entity-sync WS bridge; on terminal `succeeded` the UI
reveals a download button (signed URL backed by the blob-store
adapter). The nightly regeneration is a separate `setInterval` that
submits the same task type with `idempotencyKey: \`nightly-${date}\``
to dedupe across replicas.

### P3. Library author building a custom pipeline

> _I'm shipping a FuryStack package that runs scheduled compliance
> scans across customer data: enumerate datasets, scan each in parallel,
> aggregate findings, store the report. Some scans take minutes; some
> seconds. I want first-class progress, retries, and a tree view in the
> admin UI without rebuilding the orchestration plumbing._

**Story:** P3 defines `enumerate`, `scan`, `aggregate` task types. The
top-level handler `spawnChild('enumerate')` → `awaitChildren` →
`spawnChild('scan')` × N → `awaitChildren` → `spawnChild('aggregate')`.
The library ships nothing else; FuryStack handles persistence, retry,
DAG resume, progress, and (via `/tasks/${id}/tree`) visualization.

## 6. Architecture overview

```
+----------------------+   +-------------------+   +-------------------+
| App handlers         |   | Task client SDK   |   | Task admin UI     |
| (defineTaskHandler)  |   | (browser/Shades)  |   | (Shades, future)  |
+-----------+----------+   +---------+---------+   +---------+---------+
            |                        |                       |
            v                        v                       v
+--------------------------------------------------------------------+
| @furystack/task-runner (TaskRunner token)                          |
|  - submit/cancel/get/subscribe                                     |
|  - claim/heartbeat/ack/reclaim (worker side)                       |
|  - DAG primitives (spawnChild/awaitChildren)                       |
|  - replay engine (continuation)                                    |
+----------------+---------------------------+-----------------------+
                 |                           |
                 v                           v
+----------------------------+   +-----------------------------------+
| Task DataSets              |   | @furystack/cross-node-bus         |
| (defineDataSet over        |   | (single bus, multiple topics)     |
|  defineStore)              |   |                                   |
|  - Task                    |   | Cold lane (terminal status writes |
|    persisted control plane |   |  via entity-sync):                |
|    + DAG edges + attempts  |   |   entity/Task                     |
|  - TaskReplayLog           |   |                                   |
|    handler step log,       |   | Hot lane (per task type):         |
|    keyed (taskId, stepIdx) |   |   tasks/progress/${type}          |
+----------------------------+   |   tasks/status/${type}            |
                                 |   tasks/cancel/${type}            |
                                 +-----------------------------------+

+-----------------------------------------------------+
| Queue adapter (claim transport — separate from bus) |
|  - in-process default                               |
|  - @furystack/redis-task-runner (Redis Streams)     |
+-----------------------------------------------------+
            |                                |
            v                                v
+--------------------------------------------------------------------+
| @furystack/blob-store (BlobStore token)                            |
|  - put/get/delete/head/list                                        |
|  - getDownloadUrl / getUploadUrl (when supported)                  |
+----------------+----------------+--------------------+-------------+
                 |                |                    |
                 v                v                    v
       in-memory          filesystem         S3-compatible
       (testing)          (single-node)      (production)
```

**Why per-task-type topics, not per-`taskId`.** A topic per `taskId`
would mint one underlying broker stream per task — millions on a
busy fleet, each requiring tracking and cleanup. A per-type topic
caps the broker footprint at the task-type count (typically tens),
keeps the bus's per-topic replay window meaningful per-type, and
matches the consumer-group shape future networked adapters use.
Subscribers filter by `taskId` client-side; that cost is one map
lookup per event — negligible vs. broker-side stream multiplication.

**Cold lane vs. hot lane.** Both ride the same `CrossNodeBus`; only
the topic differs. The cold lane is the dataset's own change-stream
(`entity/Task`) propagated by `EntityChangeBus` — terminal-state
flips reach every node automatically, no extra runner code needed.
The hot lane is direct `bus.publish` from the runner under the
`tasks/...` namespace; it carries per-percent progress, terminal
status (for the Q5 backup wake described in §11), and cancel
broadcast. Hot-lane events are best-effort; cold lane is the
durability floor.

- **`@furystack/task-runner`** owns the abstraction: `TaskRunner` token,
  task entity schema, handler/worker DSL, DAG primitives, replay engine.
  Default queue adapter is in-process. Real adapters live in their own
  publishable packages (`@furystack/redis-task-runner`, future
  `@furystack/sqs-task-runner`, etc.).
- **`@furystack/blob-store`** owns the binary-storage abstraction:
  `BlobStore` token, `BlobRef` type, capability declarations, in-memory
  default. Real adapters (`@furystack/filesystem-blob-store`,
  `@furystack/s3-blob-store`) live in their own publishable packages.
- **Task state** lives in a `defineDataSet` over a `defineStore`. Apps
  pick the backing store the same way they pick `mongodb-store` /
  `redis-store` / `sequelize-store` for any other entity. Dataset
  subscriptions provide cross-node fan-out of terminal-state changes
  via the existing entity-sync path. The cross-node bus carries
  high-frequency progress reports separately so the dataset is not
  written on every percent-change.
- **`@furystack/task-runner-client`** is the browser-side SDK consuming
  the runner's REST + WS endpoints. Shades-specific helpers ship later
  in `@furystack/shades-task-runner`.

This mirrors the layered approach of `defineStore` /
`defineFileSystemStore` and `cross-node-bus` / `redis-cross-node-bus`.

### Multi-service deployment shape

The runner inherits the bus PRD's deployment story: N services × M nodes
per service, single broker, distinct `topicPrefix` and `serviceName` per
service. The runner's queue adapter accepts `topicPrefix` /
`serviceName`; tenant scoping inside one service is an application
concern carried on the task payload. A worker may host one or more task
types; the same injector graph that serves HTTP can also host workers
in dev/single-pod, or run as a dedicated worker process in production.

The runner publishes raw topic names (`tasks/progress/${type}` etc.)
and lets the bound `CrossNodeBus` prepend its own `topicPrefix` on
the wire — single source of truth. A multi-service deployment that
binds `defineRedisCrossNodeBusAdapter({ topicPrefix: 'svc-a/' })`
gets `svc-a/tasks/progress/${type}` on the wire automatically;
cross-service task observability (e.g. an admin service watching
another service's tasks) uses
`bus.subscribeForeign('svc-a/', 'tasks/status/${type}', ...)`,
matching the same opt-in-eavesdrop pattern as `IdentityEventBus`
and `EntityChangeBus`.

## 7. API contract

### 7.1 Task entity

```ts
type TaskStatus =
  | 'draft' // created, not yet released to the queue (two-phase submit)
  | 'pending' // released, waiting for a worker to claim
  | 'claimed' // a worker holds the lease
  | 'running' // handler started
  | 'waiting' // suspended, waiting for children to terminate
  | 'cancelling' // cancellation requested, propagating
  | 'cancelled' // terminal
  | 'succeeded' // terminal
  | 'failed' // terminal, retries exhausted

type AttemptStatus = 'in-progress' | 'succeeded' | 'failed' | 'cancelled' | 'timed-out'

type AttemptRecord = {
  attempt: number
  workerId: string
  startedAt: string
  finishedAt?: string
  status: AttemptStatus
  error?: { name: string; message: string; stack?: string }
}

type TaskEvent =
  | { at: string; kind: 'submitted' }
  | { at: string; kind: 'claimed'; workerId: string }
  | { at: string; kind: 'progress-milestone'; percent: number; meta?: Record<string, unknown> }
  | { at: string; kind: 'spawned-child'; childTaskId: string; childType: string }
  | { at: string; kind: 'child-completed'; childTaskId: string; status: 'succeeded' | 'failed' | 'cancelled' }
  | { at: string; kind: 'status-changed'; from: TaskStatus; to: TaskStatus }
  | { at: string; kind: 'attempt-failed'; attempt: number; willRetry: boolean }
  | { at: string; kind: 'cancellation-requested'; reason?: string }

type Task<TPayload = unknown, TResult = unknown> = {
  id: string
  type: string
  handlerVersion: number
  status: TaskStatus
  payload: TPayload
  result?: TResult
  error?: { name: string; message: string }
  progress?: { percent: number; meta?: Record<string, unknown>; updatedAt: string }
  parentTaskId?: string
  childTaskIds: string[]
  submittedBy?: string // identity, when available
  submittedAt: string
  notBefore?: string
  idempotencyKey?: string
  attempts: AttemptRecord[]
  events: TaskEvent[] // capped, default 1000
  producedBlobs: BlobRef[]
  consumedBlobs: BlobRef[]
  retentionPolicy: TaskRetentionPolicy
  tags: string[]
  // adapter-managed:
  visibilityDeadline?: string
  workerId?: string
  resumeToken?: string // opaque, framework-internal
}

type TaskRetentionPolicy = {
  onSuccess: 'keep' | 'delete-intermediate' | 'delete-all'
  onFailure: 'keep' | 'delete-all'
  ttlAfterTerminalDays: number
}
```

`Task` is stored in a `defineDataSet` over a `defineStore`. `events` is
capped at a configurable size (default 1 000) to bound storage; older
events are pruned when the cap is exceeded but `attempts` is never
pruned.

### 7.2 `TaskRunner` interface

```ts
export type TaskRunner = Disposable & {
  /** Submit a new task. Returns the persisted Task. */
  submit<TPayload = unknown>(args: {
    type: string
    payload: TPayload
    handlerVersion: number
    idempotencyKey?: string
    notBefore?: Date
    tags?: string[]
    parentTaskId?: string // framework-set; not for app use
    retentionPolicy?: Partial<TaskRetentionPolicy>
  }): Promise<Task>

  /** Cancel a task. Cascades to children. Idempotent. `reason` is recorded
   *  on the event log and surfaced on the resulting `TaskUpdate`. */
  cancel(taskId: string, reason?: string): Promise<void>

  /** Get current task state. */
  get(taskId: string): Promise<Task | undefined>

  /** Walk parent + descendants. */
  getTree(taskId: string): Promise<TaskTreeNode>

  /** Subscribe to status/progress for a single task. */
  subscribe(taskId: string, handler: (event: TaskUpdate) => void): Disposable

  /** Subscribe to all updates of a given task type (admin / observability). */
  subscribeByType(type: string, handler: (event: TaskUpdate) => void): Disposable

  /** Register a worker. Used by `defineWorker` via DI; apps rarely call
   *  this directly. See implementation note 6. */
  registerWorker(options: RegisterWorkerOptions): Worker

  /** Adapter capabilities, declared statically. */
  readonly capabilities: TaskRunnerCapabilities
}

export type TaskRunnerCapabilities = {
  readonly persistent: boolean // queue survives broker restart
  readonly fleetCapEnforcement: boolean
  readonly delayedDispatch: boolean // notBefore honored at broker level
  readonly maxPayloadBytes: number // soft hint; submit may reject larger
}

export type TaskUpdate =
  | { kind: 'status'; taskId: string; status: TaskStatus; at: string; reason?: string }
  | { kind: 'progress'; taskId: string; percent: number; meta?: Record<string, unknown>; at: string }
  | { kind: 'spawned-child'; taskId: string; childTaskId: string; at: string }
  | {
      kind: 'child-completed'
      taskId: string
      childTaskId: string
      status: 'succeeded' | 'failed' | 'cancelled'
      at: string
    }
```

### 7.3 Worker DSL

```ts
import { defineTaskHandler, defineWorker } from '@furystack/task-runner'

const probeVideo = defineTaskHandler<{ inputBlob: BlobRef }, { duration: number; tracks: TrackInfo[] }>({
  type: 'video-probe',
  version: 1,
  retryPolicy: { maxAttempts: 3, backoff: 'exponential', baseDelayMs: 1000, jitter: 0.2 },
  retentionPolicy: { onSuccess: 'delete-intermediate', onFailure: 'keep', ttlAfterTerminalDays: 7 },
  cancelOnDrain: true,
  visibilityTimeoutMs: 60_000,
  // Hot-lane progress is coalesced server-side: at most one publish
  // per task per `progressThrottleMs`. Default 250ms (4Hz). Set to
  // `Infinity` to suppress hot-lane publishes entirely (cold-lane
  // dataset writes still happen at the runner's coalesce rate).
  progressThrottleMs: 250,
  handler: async (ctx, { inputBlob }) => {
    const stream = await ctx.blobStore.get(inputBlob.key)
    const probe = await ctx.fetch(/* … */) // determinism-safe wrapper
    return { duration: probe.duration, tracks: probe.tracks }
  },
})

const encodeVideo = defineTaskHandler<EncodePayload, EncodeResult>({
  type: 'video-encode-h264',
  version: 1,
  handler: async (ctx, payload) => {
    const probe = await ctx.spawnChildAndAwait('video-probe', { inputBlob: payload.inputBlob })
    const chunkCount = chooseChunkCount(probe.duration)
    const chunks = await ctx.awaitChildren(
      Array.from({ length: chunkCount }, (_, i) =>
        ctx.spawnChild('video-encode-chunk', { inputBlob: payload.inputBlob, chunkIndex: i, chunkCount }),
      ),
    )
    const muxed = await ctx.spawnChildAndAwait('video-mux', { chunks: chunks.map((c) => c.outputBlob) })
    return { outputBlob: muxed.outputBlob, duration: probe.duration }
  },
})

export const VideoEncodeWorker = defineWorker({
  name: 'my-app/VideoEncodeWorker',
  types: [probeVideo, encodeVideo /* … */],
  concurrency: 2,
  tags: ['gpu', 'region:eu'],
  compatibleVersions: { 'video-encode-h264': [1] },
})
```

The handler context (`ctx`) provides:

```ts
type TaskContext<TPayload> = {
  taskId: string
  attempt: number
  payload: TPayload
  injector: Injector
  blobStore: BlobStore

  /** Periodic heartbeat. Auto-called by reportProgress; rarely called directly. */
  heartbeat(): Promise<void>

  /** Hot-lane progress fan-out + cold-lane coalesced dataset write. */
  reportProgress(progress: { percent: number; meta?: Record<string, unknown> }): void

  /** Spawn a child task; returns a handle. Recorded for replay. */
  spawnChild<TIn, TOut>(type: string, payload: TIn, opts?: SpawnOptions): ChildHandle<TOut>

  /** Block on a set of child handles. Suspends the parent (re-enqueued on completion). */
  awaitChildren<THandles extends ChildHandle<unknown>[]>(
    handles: THandles,
  ): Promise<{ [K in keyof THandles]: ResultOf<THandles[K]> }>

  /** Sugar for spawnChild + awaitChildren of one. */
  spawnChildAndAwait<TIn, TOut>(type: string, payload: TIn, opts?: SpawnOptions): Promise<TOut>

  /** Allocate a blob key scoped to this task; recorded in producedBlobs. */
  allocateBlob(suffix: string, opts?: { contentType?: string }): BlobRef

  /** AbortSignal that fires on cancellation (cascade or direct). */
  readonly cancellationSignal: AbortSignal

  /** Determinism-safe wrappers; replay-stable. */
  now(): Date
  random(): number
  sleep(ms: number): Promise<void>
  fetch: typeof fetch // recorded inputs/outputs replayed from cache
}
```

### 7.4 Replay & continuation

The runtime treats each handler invocation as a re-execution from the
top of the function. Recorded steps (`spawnChild`, `awaitChildren`,
`reportProgress`, `ctx.now()`, `ctx.random()`, `ctx.fetch()`,
`ctx.sleep()`) consult an append-only log on the task entity:

- On first execution, calls run normally and append entries to the log.
- On replay (after children completed, or after a worker crash mid-await),
  calls return cached values from the log instead of re-executing.

`awaitChildren` semantics:

- **First call**: records the child handles, throws an internal
  `Suspended` sentinel. Runtime catches it, transitions task to
  `waiting`, persists, releases the worker slot.
- **On child terminal status**: bus event triggers a re-enqueue of the
  parent with a `resumeToken` referencing the await point.
- **Replay**: handler runs from top; `spawnChild` returns cached child
  IDs; `awaitChildren` resolves with cached results.
- **Child failure**: cached entry contains the error; `awaitChildren`
  rejects. Handler may catch, retry (`spawnChild` again with a fresh
  payload), or rethrow.

This is a **deliberate Temporal-flavored design**, scoped to "good
enough for FuryStack apps". Apps that need bulletproof determinism
(financial workflows etc.) should reach for a dedicated workflow engine.

#### Continuation flow

When a child reaches a terminal status, three independent paths
converge to wake any waiting parent — exactly one of them re-enqueues,
the others are no-ops via CAS on `Task.status`:

1. **Originating-worker fast path.** The worker that just finished the
   child queries the parent's awaited-children set (cached on the
   parent row from the suspending `awaitChildren` call). If all are
   terminal, it CAS-flips the parent from `waiting → pending` and
   pushes the resume token into the queue. This is the common case
   and runs sub-millisecond.
2. **Bus-driven backup.** Every node that hosts a worker for the
   parent's task type subscribes to `tasks/status/${type}`. On a
   terminal event, the same "all terminal? → CAS + re-enqueue"
   check runs. Catches the case where the originating worker
   crashed between writing the child's terminal status and pushing
   the resume token. Recovery latency = bus latency.
3. **Periodic reconciler.** A low-frequency sweeper (default scan
   interval 1h) walks `waiting` parents, queries children, runs the
   same check. Catches anything paths 1 and 2 both missed (e.g.
   broker outage during the bus-driven attempt).

CAS-on-`Task.status` is the dedup key — only the first path to
flip `waiting → pending` wins; the rest are idempotent no-ops.

#### Worker bus subscription set

Workers subscribe to two topics per task type they declare in
`defineWorker.types`:

- `tasks/cancel/${type}` — wake signal; worker filters by
  `taskId in heldLeases` and aborts the matching `ctx.cancellationSignal`.
- `tasks/status/${type}` — backup-wake input for the continuation
  flow above.

Workers do **not** subscribe to `tasks/progress/${type}` — they only
publish there. API/WS nodes do the inverse: they subscribe to
`tasks/progress/${type}` and `tasks/status/${type}` for types their
clients have asked about, and never to `tasks/cancel/${type}`.

### 7.5 `BlobStore` interface

```ts
export type BlobRef = {
  readonly storeName: string // adapter binding name
  readonly key: string
  readonly contentType?: string
  readonly contentLength?: number
  readonly etag?: string
}

export type BlobMetadata = {
  readonly key: string
  readonly contentType?: string
  readonly contentLength: number
  readonly etag?: string
  readonly lastModified: Date
  /**
   * Caller-supplied key/value pairs forwarded at put time. Renamed
   * `customMetadata` on the metadata side to disambiguate from
   * `BlobPutOptions.metadata` (the input field).
   */
  readonly customMetadata?: Record<string, string>
}

export interface BlobStore extends Disposable {
  /** Adapter binding name embedded in every {@link BlobRef} this store mints. */
  readonly storeName: string

  put(
    key: string,
    payload: ReadableStream<Uint8Array> | NodeJS.ReadableStream | Buffer | Uint8Array,
    opts?: { contentType?: string; contentLength?: number; metadata?: Record<string, string> },
  ): Promise<BlobRef>

  get(key: string): Promise<{
    stream: ReadableStream<Uint8Array>
    contentType?: string
    contentLength?: number
    etag?: string
  }>

  delete(key: string): Promise<void>
  head(key: string): Promise<BlobMetadata | undefined>
  list(
    prefix: string,
    opts?: { cursor?: string; limit?: number },
  ): Promise<{ items: BlobMetadata[]; nextCursor?: string }>

  /** Throws `BlobStoreError({ code: 'capability-missing' })` if !capabilities.presignedUrls. */
  getDownloadUrl(key: string, opts: { ttlSec: number }): Promise<string>
  getUploadUrl(
    key: string,
    opts: { ttlSec: number; contentType?: string; maxBytes?: number },
  ): Promise<{ url: string; method: 'PUT' | 'POST'; fields?: Record<string, string> }>

  readonly capabilities: BlobStoreCapabilities
}

export interface BlobStoreCapabilities {
  readonly presignedUrls: boolean
  readonly multipart: boolean
  readonly range: boolean // get(key, { range }) future-proofing
  readonly crossNodeAccessible: boolean // false for fs adapter
  readonly maxObjectBytes: number
}
```

**Errors.** Every adapter throws `BlobStoreError` with a `code`
discriminator (`'not-found' | 'invalid-key' | 'invalid-config' |
'capability-missing' | 'too-large' | 'conflict' | 'io-error' |
'signature-invalid'`). Apps `switch` on `.code` rather than
substring-matching the message; `BlobStoreError.is(value)` is the
realm-safe type guard. The shared
`BlobStoreNotConfiguredError` subclass surfaces from the default
factory binding.

**`metadata` vs. `customMetadata`.** Put input uses `opts.metadata`
to match S3's `Metadata` parameter naming; the head/list output
field is `customMetadata` so it does not clash with the wider
"metadata" record TypeScript users mentally associate with the
`BlobMetadata` type itself.

**Stream shapes.** `put` accepts a Web `ReadableStream<Uint8Array>`,
a Node `Readable`, a Node `Buffer`, or a `Uint8Array`. `get` always
returns a Web `ReadableStream<Uint8Array>` so consumers stay
portable; Node-side callers adapt with `Readable.fromWeb`.

### 7.6 Tokens & default factories

```ts
export const TaskRunner = defineService({
  name: 'furystack/task-runner/TaskRunner',
  lifetime: 'singleton',
  factory: ({ inject }) =>
    new InProcessTaskRunner({
      bus: inject(CrossNodeBus),
      taskDataSet: inject(TaskDataSet),
      blobStore: inject(BlobStore),
    }),
})

export const BlobStore = defineService({
  name: 'furystack/blob-store/BlobStore',
  lifetime: 'singleton',
  factory: () => {
    throw new BlobStoreNotConfiguredError()
  },
})
```

The default factory deliberately throws `BlobStoreNotConfiguredError`
— blobs are typically large and persistence-sensitive, so unbound
resolution is treated as a misconfiguration rather than silently
falling back to volatile in-memory storage. Apps explicitly bind a
backing adapter (`defineFileSystemBlobStore`, `defineS3BlobStore`,
or for tests `() => new InMemoryBlobStore()`); the boot-time
capability cross-check (§9) refuses adapter combinations that
cannot work cross-node. `InMemoryBlobStore` ships from the core
package so test suites can wire it directly without an extra
dependency.

Note: this diverges from `CrossNodeBus`, which keeps an in-process
default. Re-evaluating that default is tracked separately.

### 7.7 WS subscribe shape (subscribe race + first-event loss)

The `WS /tasks/subscribe` flow has a race: a client may subscribe
after a worker has already published its first progress event, and
on networked bus adapters the server-side bus subscription itself
takes a wire round-trip to become live (Redis Streams cursor
initialisation; see `RedisCrossNodeBus.whenReady`).

The runner closes both windows by (1) awaiting any
`bus.whenReady?(topic)` the adapter exposes, (2) reading a snapshot
of the task from the dataset, and (3) streaming subsequent bus events:

```ts
async function handleTaskSubscribe(taskId: string, send: (msg: TaskUpdate) => void) {
  const task = await taskDataSet.get(injector, taskId)
  if (!task) throw new RequestError('Task not found', 404)

  const progressTopic = `tasks/progress/${task.type}`
  const statusTopic = `tasks/status/${task.type}`
  await bus.whenReady?.(progressTopic)
  await bus.whenReady?.(statusTopic)

  send({ kind: 'snapshot', task })

  let lastSeenSeq: string | undefined
  const dispatch = (kind: 'progress' | 'status', message: BusMessage) => {
    if ((message.payload as { taskId: string }).taskId !== taskId) return
    if (lastSeenSeq && message.seq && bus.compareSeq(message.seq, lastSeenSeq) <= 0) return
    if (message.seq) lastSeenSeq = message.seq
    send({ kind, ...(message.payload as object) } as TaskUpdate)
  }
  return [
    bus.subscribe(progressTopic, (m) => dispatch('progress', m)),
    bus.subscribe(statusTopic, (m) => dispatch('status', m)),
  ]
}
```

`whenReady?` is optional on the bus interface — adapters that do
not need it (in-process) implement as a no-op. Server-side dedup
by `bus.compareSeq` filters any event already covered by the
snapshot's `progress.updatedAt` timestamp; clients render
last-write-wins on the UI side as a second line of defence.

## 8. Adapters

### 8.1 Queue adapters

| Adapter              | Persistent | Fleet cap | Delayed dispatch | Setup  | First impl?       |
| -------------------- | ---------- | --------- | ---------------- | ------ | ----------------- |
| In-process           | ❌\*       | local     | ✅               | none   | ✅ ships in v1    |
| Redis Streams        | ✅         | atomic    | ✅               | low    | ✅ first concrete |
| NATS JetStream       | ✅         | yes       | ✅               | medium | later             |
| SQS / Cloud Tasks    | ✅         | partial   | ✅               | medium | later             |
| Postgres skip-locked | ✅         | yes       | ✅               | low    | later             |

\* In-process queue does not survive process exit _as a queue_, but the
**task dataset** does. On boot, workers reclaim claimed-but-not-completed
tasks belonging to their compatible types and resume.

### 8.2 Blob-store adapters

| Adapter       | Presigned | Multipart | Cross-node | Setup             | First impl?    |
| ------------- | --------- | --------- | ---------- | ----------------- | -------------- |
| In-memory     | ❌        | ❌        | ❌         | none              | ✅ (testing)   |
| Filesystem    | ❌\*      | ❌        | ❌         | none              | ✅ ships in v1 |
| S3-compatible | ✅        | ❌\*\*    | ✅         | low (MinIO local) | ✅ ships in v1 |
| Azure Blob    | ✅        | ✅        | ✅         | medium            | later          |
| GCS native    | ✅        | ✅        | ✅         | medium            | later          |

\* Filesystem adapter exposes server-proxy upload/download endpoints
that mimic the presigned-URL flow at the API layer, so client SDK code
is identical regardless of adapter. The capability flag is still
`presignedUrls: false` because the URL is not transport-direct.

\*\* v1 of the S3 adapter uses single-part `PutObject` only —
`maxObjectBytes = 5 GiB` (AWS S3 single-part cap). Apps with very
large blobs that need resumable multipart can compose
`@aws-sdk/lib-storage`'s `Upload` themselves on the underlying
`S3Client` and pass the resulting key back as a `BlobRef`. v1.x will
add a multipart-aware `put` variant and lift the capability flag —
tracked in §16 open question 7 (settled).

### 8.3 `defineXxxTaskRunner` / `defineXxxBlobStore`

Adapters expose factory helpers analogous to `defineRedisStore`:

```ts
import { defineRedisTaskRunner } from '@furystack/redis-task-runner'
import { defineS3BlobStore } from '@furystack/s3-blob-store'

injector.bind(
  TaskRunner,
  defineRedisTaskRunner({
    url: 'redis://redis:6379',
    topicPrefix: 'svc-a/',
    serviceName: 'svc-a',
    visibilityTimeoutMs: 60_000,
    concurrencyLimits: { 'video-encode-h264': 4 },
  }),
)

const s3Client = new S3Client({
  endpoint: 'https://s3.eu-central-1.amazonaws.com',
  region: 'eu-central-1',
  credentials: {
    /* … */
  },
})

injector.bind(
  BlobStore,
  defineS3BlobStore({
    client: s3Client,
    bucket: 'furystack-blobs',
    keyPrefix: 'svc-a/',
  }),
)
```

Constructor-passed config; adapters never read `process.env` directly.
The S3 adapter takes a caller-owned `S3Client` so connection lifecycle
(credentials refresh, `client.destroy()`) stays with the application —
the adapter never closes it. The Redis bus adapter follows the same
ownership rule.

## 9. Capability matrix & enforcement

Capabilities are declared statically by every adapter and asserted at
runtime startup. A misconfigured deployment fails loudly at boot, never
silently degrades.

| Combination                                                     | Result                                               |
| --------------------------------------------------------------- | ---------------------------------------------------- |
| Single-pod dev: in-process runner + in-memory blob + any bus    | ✅                                                   |
| Single-pod dev: in-process runner + filesystem blob + any bus   | ✅                                                   |
| Single-node prod: in-process runner + filesystem blob + any bus | ✅                                                   |
| Multi-node: Redis runner + filesystem blob                      | ❌ — refuses to start (`crossNodeAccessible: false`) |
| Multi-node: Redis runner + S3 blob + Redis bus                  | ✅                                                   |
| Multi-node: Redis runner + S3 blob + in-process bus             | ❌ — refuses to start (`crossNodeDelivery: false`)   |
| Multi-node: Redis runner + in-memory blob                       | ❌ — same as filesystem case                         |

Per-handler capability assertions are also possible: a handler that
declares `requires: { presignedUrls: true }` refuses to register against
a blob-store that lacks the capability.

### 9.1 Bus capability requirement

The runner needs the bus to actually deliver across processes. The
in-process bus serves single-pod deployments correctly but cannot
deliver to other nodes; pairing it with a multi-node queue silently
breaks cancel, status backup wake (§7.4), and progress fan-out.

The capability check requires `@furystack/cross-node-bus` to add a
new flag to `CrossNodeBusCapabilities`:

```ts
type CrossNodeBusCapabilities = {
  readonly persistent: boolean
  readonly replay: boolean
  readonly assignsSequence: boolean
  // NEW — declared by every adapter. In-process: false; Redis: true.
  readonly crossNodeDelivery: boolean
}
```

The runner factory asserts at boot:

```ts
if (queueAdapter.capabilities.distributed && !bus.capabilities.crossNodeDelivery) {
  throw new Error(
    'TaskRunner: bound queue adapter is multi-node-capable but the bound CrossNodeBus is in-process. ' +
      'Bind a cross-node bus adapter (e.g. defineRedisCrossNodeBusAdapter) before starting workers.',
  )
}
```

The flag is also useful as a self-documenting signal for future
facades and for telemetry attribution. Adding it does **not** force
existing facades (`IdentityEventBus`, `EntityChangeBus`) to assert
on it — those facades' own capability requirements (`replay` +
`assignsSequence` for entity-sync) remain unchanged. Apps that
deploy `EntityChangeBus` against an in-process bus today are
implicitly single-node anyway; the runner is the first consumer
where the multi-node footgun materialises.

## 10. Reference implementation: video encoder

This section illustrates how the primitives compose. It is **not** part
of the framework — it is a worked example shipped as
`@furystack/task-runner-examples/video-encoder` (separate showcase
package, not v1 release scope).

### 10.1 Task types

| Type                 | Children                                                            | Inputs                                | Result                         |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------- | ------------------------------ |
| `process-upload`     | `video-probe`, `video-encode-h264`\*N, `thumbnail`, `video-package` | uploaded blob                         | manifest blob + thumbnail blob |
| `video-probe`        | none                                                                | input blob                            | duration + tracks              |
| `video-encode-chunk` | none                                                                | input blob, chunk range, codec params | encoded chunk blob             |
| `video-mux`          | none                                                                | chunk blobs                           | muxed mp4 blob                 |
| `video-package`      | none                                                                | muxed mp4                             | HLS manifest + segment blobs   |
| `thumbnail`          | none                                                                | input blob, timestamp                 | jpg blob                       |

`video-encode-h264` is itself composed:

```ts
const encodeH264 = defineTaskHandler({
  type: 'video-encode-h264',
  version: 1,
  handler: async (ctx, { inputBlob, profile }) => {
    const probe = await ctx.spawnChildAndAwait('video-probe', { inputBlob })
    const chunkCount = chooseChunkCount(probe.duration, profile)
    const chunks = await ctx.awaitChildren(
      Array.from({ length: chunkCount }, (_, i) =>
        ctx.spawnChild('video-encode-chunk', { inputBlob, chunkIndex: i, chunkCount, profile }),
      ),
    )
    const mux = await ctx.spawnChildAndAwait('video-mux', { chunks: chunks.map((c) => c.outputBlob) })
    return { outputBlob: mux.outputBlob, profile, duration: probe.duration }
  },
})
```

### 10.2 Submission flow

```
client                          api server                  blob-store           queue
  |                                |                            |                  |
  |--- POST /tasks --------------->|                            |                  |
  |    type: 'process-upload'      |                            |                  |
  |    payload: {profile,...}      |                            |                  |
  |    requests blob upload tickets|                            |                  |
  |                                |                            |                  |
  |                                |--- allocate keys --------->|                  |
  |                                |--- getUploadUrl ---------->|                  |
  |                                |                            |                  |
  |<--- 201 {taskId, uploads} -----|                            |                  |
  |                                |                            |                  |
  |--- PUT $uploadUrl (file) ----------------------------------->                  |
  |<--- 200 -----------------------------------------------------                  |
  |                                |                            |                  |
  |--- POST /tasks/$id/start ----->|                            |                  |
  |                                |--- submit (release) ------------------------> |
  |<--- 200 -----------------------|                            |                  |
  |                                |                            |                  |
  |--- WS subscribe(taskId) ------>|                            |                  |
  |                                |                            |                  |
  |    (workers claim, run, report progress over bus, persist terminal state)     |
  |                                |                            |                  |
  |<--- WS progress events --------|                            |                  |
  |<--- WS status: succeeded ------|                            |                  |
  |                                |                            |                  |
  |--- GET /tasks/$id/download --->|                            |                  |
  |                                |--- getDownloadUrl -------->|                  |
  |<--- 302 $signedUrl ------------|                            |                  |
  |--- GET $signedUrl ------------------------------------------>                  |
  |<--- 200 file -----------------------------------------------|                  |
```

### 10.3 Cancellation

User clicks "cancel" → `DELETE /tasks/${id}`:

1. API authorizer validates submitter or admin.
2. `runner.cancel(id)` flips parent to `cancelling`, publishes
   `child-cancel` events for every descendant in `pending`/`claimed`/
   `running`/`waiting`.
3. Workers running children receive `ctx.cancellationSignal.aborted = true`.
4. ffmpeg subprocesses get `SIGTERM`; uncooperative workers are reclaimed
   via visibility timeout.
5. Sweeper deletes intermediate blobs per `retentionPolicy.onFailure`.

## 11. Cross-cutting concerns

### Delivery semantics

- **Tasks are exactly-once persisted, at-least-once executed**. The
  dataset row is the source of truth; a successful `complete` is
  acknowledged before the row flips to terminal. A worker that crashes
  after running side effects but before acknowledgement will see its
  task reclaimed and replayed — this is why determinism-safe `ctx.*`
  helpers exist (§7.4).
- **Idempotency** is the caller's responsibility for non-replayable
  side effects. The submit-time `idempotencyKey` deduplicates submits;
  it does not deduplicate handler executions.

### Publish-after-persist (hot lane)

The runner persists state before publishing on the bus. Order on
every state transition (status flip, progress tick, child terminal):

1. Write the dataset row (cold lane / source of truth).
2. On successful write, fire-and-forget `void bus.publish(...)`
   (hot lane / wake signal).

A failed bus publish is logged via the bus's existing
`onCrossNodeError` telemetry; recovery is the §7.4 continuation
backup wake plus the periodic reconciler. The reverse order would
let a successful bus event escape ahead of (or instead of) a
durable dataset row, triggering wasted bus-driven queries and, on
mid-write crash, double-firing handler side effects via
visibility-timeout reclaim.

The runner never `await`s `bus.publish` on the hot path — handler
work is the priority; bus latency must not become handler latency.
The same rule applies to `ctx.reportProgress` (§7.3): the helper
coalesces per `progressThrottleMs` and emits fire-and-forget.

### Cancel transport

`runner.cancel(taskId)` does three things, in order:

1. CAS-flip `Task.status` to `cancelling` in the dataset.
2. Walk descendants in the dataset; for each non-terminal descendant,
   CAS-flip its status to `cancelling`.
3. Publish one `tasks/cancel/${type}` per affected type carrying
   `{taskIds: [...]}` for fan-out efficiency.

Workers receive the broadcast, intersect the payload's `taskIds`
with their own `heldLeases` map, and abort matching
`ctx.cancellationSignal`s. Workers without a matching lease ignore
the event — single map lookup per topic event. Visibility timeout
is the safety net for uncooperative workers (handlers that swallow
the abort or perform unkillable work).

### Determinism constraints (replay-based handlers)

- Handlers MUST source `Date.now()`, `Math.random()`, `setTimeout`,
  `fetch`, and other side-effecting calls from `ctx.*` wrappers.
- Handlers MUST be deterministic up to recorded steps. Non-deterministic
  branching on `ctx.now()`-derived data after a recorded step is fine
  because the recorded step pins the value across replays.
- An `@furystack/eslint-plugin` rule (`no-non-deterministic-globals-in-handler`)
  flags forbidden globals inside `defineTaskHandler` factory bodies.
- **This is pragmatic determinism, not VM-sandboxed determinism**.
  Apps with hard correctness requirements should use a dedicated
  workflow engine — that is explicitly out of scope.

### Security

- All REST endpoints (`POST /tasks`, `GET /tasks/${id}`, `DELETE /tasks/${id}`,
  `GET /tasks/${id}/download`, `GET /tasks/${id}/tree`,
  `WS /tasks/subscribe`) are mounted with `@furystack/rest-service`
  `Authenticate()` + `Authorize(...roles)` wrappers configured per task
  type by the app via the `useTaskRunnerEndpoints({ authorizers })`
  option. Credential storage continues to live behind
  `@furystack/security`.
- The submitter identity (when available) is captured on the task
  entity (`submittedBy`) for audit and visibility filtering.
- Workers authenticate as service-account identities and require a
  `worker:${type}` role (or `worker:*` for shared pools).
- Blob upload/download URLs are TTL-bound; default TTL = the
  submitter session TTL when the request carries identity, else 1 hour.
- Adapters that talk to a network broker (Redis, S3) MUST support TLS
  and authentication.

### Observability

Every task lifecycle event emits structured telemetry on
`ServerTelemetryToken`:

- `onTaskSubmitted` — `{ taskId, type, parentTaskId?, payloadBytes }`
- `onTaskClaimed` — `{ taskId, type, workerId, queueLagMs }`
- `onTaskCompleted` — `{ taskId, type, status, attempt, durationMs }`
- `onTaskFailed` — `{ taskId, type, attempt, willRetry, error }`
- `onTaskCancelled` — `{ taskId, type, cascadeFromTaskId? }`
- `onTaskProgress` — sampled (default 1 Hz) — `{ taskId, percent, meta? }`
- `onBlobPut` / `onBlobGet` / `onBlobDelete` — `{ key, byteLength, durationMs }`

`queueLagMs = Date.now() - submittedAt` and is the primary signal for
queue saturation alarms.

### Concurrency caps

Two layers, both enforced:

1. **Per-worker** — `defineWorker({ concurrency })` caps in-process
   parallelism for a single worker.
2. **Fleet-wide** — adapter `concurrencyLimits: { '${type}': N }` caps
   the entire fleet via a broker-side counting semaphore (Redis Lua
   atomic INCR/DECR with TTL fallback for crash recovery). Adapters
   that cannot enforce this (`fleetCapEnforcement: false`) declare
   the limit advisory and emit a startup warning.

The effective limit on a `(type, tags)` lane is `min(per-worker, fleet)`.

### Graceful drain on SIGTERM

Workers handle SIGTERM in two phases:

1. **Phase 1 (`drainTimeoutMs`, default 30 s)**: stop claiming new tasks;
   in-flight tasks finish normally. Tasks declaring `cancelOnDrain: true`
   receive `ctx.cancellationSignal.aborted = true` immediately.
2. **Phase 2**: hard process exit. Tasks not yet completed remain
   `claimed`; the broker reclaims them via visibility timeout. The
   handler's last `reportProgress`-driven heartbeat is the floor for
   reclaim latency.

Apps with explicit lifecycle control call `await runner.drain({ timeoutMs })`.

## 12. Backward compatibility

### Initial release

The runner and blob-store are net-new packages. There is nothing to
maintain compatibility with on day one.

### Schema evolution

Framework-owned task fields (`status`, `progress`, `attempts`, `events`,
…) follow normal `@furystack/entity-sync` major-version policy. App-owned
`payload` and `result` are opaque to the framework — apps own their own
migration story (idempotency keys + handler versioning give them tools
to manage it).

### Long-running tasks across deploys

`handlerVersion` records the version a task was submitted against.
Workers declare `compatibleVersions: { '${type}': [1] }` (or `[1, 2]`
for backwards-compatible changes). A worker that does not list the
task's version refuses to claim it — the task waits for a compatible
worker. In-flight tasks always finish on the version they started.

For replay-incompatible changes (e.g. a new `spawnChild` site between
existing ones), apps bump `version`, deploy workers that handle both
versions, drain old tasks, then drop the old version. This is the same
dual-accept window as `BusMessage.v` in the bus PRD.

## 13. Release plan & milestones

Numbered ordering implies prerequisites. The cross-node bus v1 is a
prerequisite for any multi-node integration testing of this PRD; the
runner can develop in parallel against an in-process bus.

### Milestone 0 — Pre-work

- [x] **M0.1 — `@furystack/blob-store` core.** `BlobStore` token,
      type definitions (`BlobRef`, `BlobMetadata`,
      `BlobStoreCapabilities`, `BlobPutOptions`, `BlobGetResult`,
      list / URL option types), `BlobStoreError` discriminated by
      `code`, `validateBlobKey` (1024-char limit, no NUL, no leading
      `/`), `InMemoryBlobStore` reference implementation,
      `normalizeBlobPutInput` / `collectBlobStream` helpers,
      `defineXxxBlobStore` helper convention (returns a
      `ServiceFactory<BlobStore>` to pass to `injector.bind`). The
      default factory throws `BlobStoreNotConfiguredError` (see §7.6
      note) — this diverges from the early draft which suggested an
      in-memory default. 100 % line coverage on the core surface.
- [x] **M0.2 — `@furystack/filesystem-blob-store`.** Filesystem
      adapter with literal-key on-disk layout (`<root>/<key>`) and a
      sibling `<key>.meta.json` sidecar for content-type + custom
      metadata. HMAC-SHA256 stateless signed tokens (≥ 32-byte secret
      enforced at construction; settles §16 open question 4).
      Server-proxy upload (`PUT`) / download (`GET`) endpoints exposed
      via the `./endpoints` subpath helper
      (`useFileSystemBlobStoreEndpoints` mounts under
      `@furystack/rest-service`'s pooled HTTP server). HTTP status
      mapping: `signature-invalid` → 403, `not-found` → 404,
      `too-large` → 413. 100 % line coverage on the adapter class.
- [x] **M0.3 — `@furystack/s3-blob-store`.** S3-compatible adapter
      (AWS S3, MinIO, R2, B2, GCS-S3-mode). Caller owns the
      `S3Client`; adapter never closes it. `manageLifecycle: true`
      default installs the abort-incomplete-multipart-after-1-day
      bucket rule on first put, tolerant of permission failures via
      `onLifecycleError`. Optional `keyPrefix` for tenant scoping
      inside a shared bucket. v1 ships single-part PUT only —
      `multipart: false`, `maxObjectBytes: 5 GiB` (settles §16 open
      question 7). Unit tests against a stubbed client; integration
      tests against MinIO; the root `docker-compose.yml` ships a MinIO
      service on `http://localhost:9000` (override via `MINIO_URL`,
      `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`), mirroring the
      `redis-store` / `mongodb-store` patterns.
- [x] **M0.4 — `@furystack/cross-node-bus` v1 milestones complete**
      (see `cross-node-bus-spike.md` Milestones 0–5). Includes the
      Redis Streams adapter (M4) and the multi-service smoke (M5),
      both of which the runner inherits as the recommended
      production transport. Also unblocks the new `crossNodeDelivery`
      capability flag this PRD requires (see §9). The runner reuses
      `@furystack/cross-node-bus/testing` (`createInProcessBusNetwork`)
      for its own multi-worker integration harness.

### Milestone 1 — Task runner core

- [x] Create `@furystack/task-runner` package with the `TaskRunner`
      token, `Task` entity definition, `defineTaskHandler`,
      `defineWorker`, `TaskContext`, `BlobRef` re-export from blob-store.
- [x] Task dataset definition (consumer apps bind it over their chosen
      `defineStore`).
- [x] In-process queue adapter as default factory.
- [x] DAG primitives: `spawnChild`, `awaitChildren`, `spawnChildAndAwait`.
- [x] Replay engine: handler step log, `SuspendedError` sentinel, resume
      tokens.
- [x] Determinism-safe ctx helpers: `now`, `random`, `sleep`. `fetch`
      recording deferred to v1.x (see M1 implementation notes below).
- [x] Retry policy + exponential backoff with jitter.
- [x] Visibility timeout + heartbeat.
- [x] Cancellation cascade.
- [x] Capability cross-check between runner, blob-store, and bus at boot.
- [x] `@furystack/task-runner/testing` subpath: `runTaskToCompletion`
      polling helper; `createTestRunner` self-contained integration
      harness with in-memory blob store.
- [x] Telemetry hooks (§11).
- [x] Unit tests covering submit, claim, progress, retry, cancel,
      DAG fan-out/fan-in, idempotency, worker concurrency, drain.
- [x] `crossNodeDelivery` flag added to `CrossNodeBusCapabilities`
      (in-process: `false`, Redis: `true`), required for §9 capability
      cross-check.

#### M1 implementation notes

Decisions and deviations from the PRD settled during implementation:

1. **`spawnChild` is async.** The PRD spec'd a sync return
   (`ChildHandle<TOut>`); implementation changed to
   `Promise<ChildHandle<TOut>>` so the replay log entry is persisted
   _before_ the child task is submitted. Fire-and-forget submit was
   the alternative but risks orphaned handles pointing to never-created
   children if the submit fails silently. Handlers use
   `await Promise.all(items.map(v => ctx.spawnChild(...)))` instead of
   a plain `.map()`.

2. **`ctx.fetch` not replay-recorded in M1.** Recording full
   request/response for deterministic replay is expensive and complex
   (large bodies, streaming, headers). Deferred to v1.x. Handlers
   that use `fetch` in M1 must be idempotent across retries.

3. **`SuspendedError` (not `Suspended`).** The PRD used `Suspended`
   as the sentinel name; implementation uses `SuspendedError` per the
   codebase convention that Error subclasses carry the `Error` suffix.

4. **Task IDs use `crypto.randomUUID()` (UUID v4).** The PRD called
   for opaque task IDs. UUID v7 (time-sortable) was considered but
   deferred — Node ships `crypto.randomUUIDv7()` from v26; swap when
   the engine requirement moves to `>=26`.

5. **Reconciler interval defaults to 30 s for in-process.** The PRD
   suggested 1 h (§7.4) with a question about sub-minute for
   in-process (§16 Q5). 30 s chosen because the in-process queue is
   volatile — after a restart, `waiting` parents whose children
   completed during downtime need re-enqueueing within a reasonable
   window for dev/test ergonomics.

6. **`TaskRunner.registerWorker` on the public interface.** The PRD
   placed worker-side methods (claim/ack/heartbeat) as internal to
   the runner. `registerWorker` was added to the `TaskRunner`
   interface directly so `defineWorker` can register via DI without
   type-casting or a separate internal token. Every adapter must
   implement it.

7. **`TaskRunner` default factory throws.** Unlike `CrossNodeBus`
   (which defaults to in-process), `TaskRunner` has no default
   binding — apps must explicitly call
   `injector.bind(TaskRunner, defineInProcessTaskRunner())`. This
   mirrors the `BlobStore` pattern (§7.6) where unbound resolution
   is treated as misconfiguration.

8. **Replay log primary key.** `TaskReplayLogEntry.id` is a composite
   string `${taskId}:${stepIndex}` to satisfy `PhysicalStore`'s
   single-field primary key constraint while preserving per-step
   uniqueness for dedup.

9. **Fire-and-forget vs. awaited persistence.** Async replay-bearing
   ctx helpers (`spawnChild`, `awaitChildren`, `sleep`) await their
   replay log persist before returning so a crash mid-handler cannot
   orphan child references or break determinism on resumption.
   Synchronous ctx helpers (`now`, `random`) cannot await — their
   replay log persist remains fire-and-forget per PRD §11. The narrow
   crash window is the documented determinism trade-off; replay still
   converges as long as the persist completed before the crash.
   `reportProgress`, `bus.publish` (hot lane), and the live subscriber
   fan-out also stay fire-and-forget — none of them affect handler
   correctness.

10. **Per-task mutex serializes read-modify-write paths.** `#submitChild`
    appending to `parent.childTaskIds`, `#pushEvent` appending to
    `task.events`, `#pushAttempt` / `#finalizeAttempt` updating
    `task.attempts`, and the `waiting → pending` transition in both
    `#wakeParent` and `#reconcile` all funnel through
    `#withTaskLock(taskId, fn)`. Without it, a parent that calls
    `spawnChild` N times in a row races its own
    `taskDs.update(parentId, …)` and loses child IDs from
    `childTaskIds`, which corrupts `getTree`, cascade-cancel, and the
    reconciler; concurrent child completions (or one child completion
    racing a sweep tick of `#reconcile`) double-enqueue the parent and
    re-run it. The mutex is a per-`taskId` Promise chain, evicted on
    settle; errors do not poison the chain. The lock is **non-reentrant**
    — callers that already hold the lock for `taskId` must not re-enter,
    so the wake/reconcile transitions push their event log entries
    _before_ acquiring the lock and only run the
    re-read-status → re-check-children → flip-status block inside it.

11. **`AttemptRecord.status` includes `'in-progress'`.** Initial pushes
    record `'in-progress'`; `#finalizeAttempt` later overwrites with
    `'succeeded'` / `'failed'` / `'cancelled'` / `'timed-out'`. The
    visibility-timeout sweeper specifically rewrites the in-flight
    attempt to `'timed-out'` when its `visibilityDeadline` lapses, so
    operators can see whether a stalled attempt was still running or
    had reached terminal state.

12. **`cancel(reason)` plumbs through events + bus.** A
    `cancellation-requested` event with the supplied `reason` is
    appended to `task.events`, and the resulting `'cancelled'` /
    `'cancelling'` `TaskUpdate` carries the same `reason` on the wire
    so subscribers (UI, audit log) can surface why a task was killed.

13. **`wakeParent` and `#reconcile` consult `resumeToken` first.** The
    parent's `awaitedChildIds` (persisted in `resumeToken` on
    suspension via `SuspendedError`) is the authoritative resumption
    set — `parent.childTaskIds` is a fallback only. This decouples
    "children spawned" from "children awaited" so a parent that awaits
    a strict subset of its spawned children is not stuck waiting on
    fire-and-forget siblings.

14. **Cascade-cancel walks the tree iteratively.** `#cascadeCancel`
    keeps a queue + visited-set instead of recursing on
    `task.childTaskIds`. Deep DAGs (or accidental cycles surviving the
    `submit`-time check) cannot blow the call stack, and the visited
    set lets the same call act as a structural cycle break.

15. **`TaskContext` construction lives in
    `task-context-factory.ts`.** The runner builds one fresh
    `TaskContext` per handler invocation by calling `buildTaskContext`
    with a stable `TaskContextFactoryDeps` record (constructed once in
    the runner constructor) and per-invocation parameters
    (`taskId`, `attempt`, `payload`, `visibilityTimeoutMs`,
    `progressThrottleMs`, `signal`, `replayIndex`, the step counter,
    and the throttled-progress accessors). Keeping the factory in its
    own module pins the surface, gives `buildReplayIndex` /
    `ReplayIndex` a natural home, and lets the runner stay focused on
    queue, replay, and dispatch concerns. Per-step replay caching
    semantics for `spawnChild`, `awaitChildren`, `now`, `random`, and
    `sleep` (note 9) live with the closures that implement them.

16. **`@furystack/filesystem-blob-store` HTTP endpoints.** The signed
    URL server (`buildFileSystemBlobStoreServerApi`) does prefix
    matching with explicit boundaries — `baseUrl` only matches
    `=== baseUrl`, `${baseUrl}/...`, or `${baseUrl}?...`, so a `baseUrl`
    of `/blobs` does not capture `/blobsfoo`. Upload temp files are
    suffixed with `crypto.randomUUID()` (not `Date.now()`) so two
    concurrent uploads to the same key in the same millisecond cannot
    collide on the temp path before the atomic rename.

### Milestone 2 — REST + WS surface

- [x] REST endpoints: `POST /tasks` (draft + upload tickets),
      `POST /tasks/:id/start`, `GET /tasks/:id`, `GET /tasks/:id/tree`,
      `DELETE /tasks/:id`, `GET /tasks/:id/download`,
      `GET /tasks/:id/blobs/:key`.
- [x] WS endpoint: `WS /tasks-socket` (default path) carrying the
      `subscribe-task` / `unsubscribe-task` envelope. Snapshots the task
      from the dataset and streams hot-lane bus events from
      `tasks/progress/${type}` and `tasks/status/${type}`, deduping by
      `bus.compareSeq` per §7.7.
- [x] `@furystack/rest-service` `Authenticate()` / `Authorize(...roles)`
      integration via per-type `authorizers` map; `submittedBy` capture
      from `IdentityContext`. (PRD §11 originally referenced
      `@furystack/security`; corrected — credential storage stays with
      `@furystack/security`, REST authorizers ship with `rest-service`.)
- [x] Blob upload-ticket flow on `POST /tasks` (returns server-allocated
      keys + presigned URLs); `POST /tasks/:id/start` releases the
      draft and may replace `payload`.
- [x] Determinism ESLint rule
      `furystack/no-non-deterministic-globals-in-handler` in
      `@furystack/eslint-plugin`.

#### M2 implementation notes

Decisions and deviations from the PRD settled during implementation:

1. **`'draft'` task status added.** `TaskStatus` gains `'draft'` to
   support the two-phase submit flow (PRD §10.2). `runner.draft(opts)`
   creates the row without enqueueing; `runner.start(taskId, { payload? })`
   flips the status to `'pending'` and dispatches, optionally replacing
   the draft's payload (typically with one carrying the resolved blob
   keys returned by the upload-ticket flow). `runner.submit()` keeps M1
   semantics (immediate enqueue) so callers from M1 are unaffected.

2. **Bus topic split.** M1 published every `TaskUpdate` on
   `tasks/status/${type}`. M2 separates them per PRD §6 — `progress`
   updates ride `tasks/progress/${type}`, status / `spawned-child` /
   `child-completed` ride `tasks/status/${type}`. `runner.cancel()`
   additionally publishes a `tasks/cancel/${type}` broadcast carrying
   `{ taskIds: [...] }` per PRD §11; workers subscribe to that topic
   for every task type they declare and intersect with locally held
   leases to abort matching cancellation signals.

3. **Authorizers live with endpoints, not handlers.** Per-type role
   lists are configured via `useTaskRunnerEndpoints({ authorizers })`
   rather than on `defineTaskHandler`. Worker code stays
   identity-shape-agnostic; deployment shape (which roles can submit /
   cancel / subscribe / download) is owned by the API wiring layer.

4. **WS endpoint is purpose-built, not entity-sync-routed.** PRD §13
   originally suggested riding the entity-sync transport. The §7.7
   snapshot+stream flow with explicit hot/cold lane handling, bus
   `compareSeq` dedup, and per-socket subscription cleanup did not fit
   `subscribe-entity`'s registration model — implemented as a dedicated
   `subscribe-task` `WebSocketAction` mounted under a separate WS path
   (`/tasks-socket` by default). The shape is still close enough that
   the M4 client SDK can reuse the entity-sync envelope conventions.

5. **`whenReady?` deferred.** PRD §7.7 references an optional
   `bus.whenReady?(topic)` await before snapshotting. The current
   `CrossNodeBus` interface does not expose this; for the in-process
   bus no readiness wait is needed and the M3 Redis adapter will add
   the hook (Redis Streams cursor initialisation needs a wire round-trip
   to become live). M2 omits the call; the hook will land alongside
   the Redis adapter in M3.

6. **Download routes.** `GET /tasks/:id/download` redirects to the
   first `producedBlobs[0]` entry (ergonomic default for the
   single-output case from PRD §10.2). `GET /tasks/:id/blobs/:key`
   covers explicit selection for multi-output tasks; the helper
   refuses keys not on the task's `producedBlobs` allowlist.

7. **Submit body shape.** `POST /tasks` accepts an optional
   `uploads: Record<name, { contentType?, maxBytes?, ttlSec? }>` map
   alongside the standard submit options. Server allocates blob keys
   under `tasks/${id}/uploads/${name}` per slot and returns
   `{ task, uploads: Record<name, { key, url, method, fields? }> }`.
   Slot names are validated against `^[A-Za-z0-9_.-]{1,64}$` to keep
   keys filesystem-safe across adapters. Upload TTL defaults to 1 hour
   (`defaultUploadTtlSec`); per-slot overrides take precedence.

8. **Adapters that lack presigned URLs return 501.** `POST /tasks`
   with `uploads:` against an `InMemoryBlobStore` (or any other
   adapter that throws `BlobStoreError({ code: 'capability-missing' })`
   from `getUploadUrl`) replies `501 capability-missing`. Apps either
   bind a URL-capable adapter (S3, filesystem with `publicUrlBase`)
   or omit `uploads:` and pre-populate payload-side blob refs.

### Milestone 3 — Redis Streams adapter

- [ ] `@furystack/redis-task-runner` package using Redis Streams +
      consumer groups for competing-consumer dispatch.
- [ ] Atomic fleet-wide concurrency cap (Lua `INCR`/`DECR` with TTL
      fallback).
- [ ] Visibility timeout via stream pending entries + reclaim script.
- [ ] Delayed dispatch via sorted-set `notBefore` index + scheduler.
- [ ] Capability flags reflect persistence / fleet cap / delayed dispatch.
- [ ] Integration tests gated on `docker-compose up redis`.
- [ ] Multi-worker smoke test against dockerized Redis covering claim
      concurrency, fleet cap, visibility reclaim, drain.

### Milestone 4 — Client SDK

- [ ] `@furystack/task-runner-client` package with `submitTask`,
      `cancelTask`, `getTask`, `subscribeProgress`, `uploadBlob`.
- [ ] Reuses `@furystack/entity-sync-client` transport for WS
      subscriptions.
- [ ] Reference upload helper handles both presigned-direct and
      server-proxy paths transparently.

### Milestone 5 — Sweeper

- [ ] `defineTaskBlobSweeper` service: scans terminal tasks past
      `retentionPolicy.ttlAfterTerminalDays`, deletes blobs per policy,
      idempotent.
- [ ] Configurable scan interval (default 1 h) and batch size.
- [ ] Telemetry hooks: `onSweeperRun`, `onSweeperBlobDeleted`.

### Milestone 6 — Multi-service smoke test

- [ ] Two services × two worker pods each, single Redis, S3 blob store,
      distinct `topicPrefix`. Assertions:
  - Tasks submitted to service A run only on service A's workers.
  - Cross-service task submission is explicit REST call (not bus-routed).
  - Fleet caps work fleet-wide.
  - Drain of one pod does not lose work.
- [ ] All §4 success metrics measured and recorded.

### Milestone 7 — Reference video-encoder showcase

- [ ] `@furystack/task-runner-examples/video-encoder` package
      demonstrating the full pipeline. **Not** part of v1 release; lands
      after v1 ships, used as the canonical multi-stage DAG example.

## 14. Risks & mitigations

| Risk                                                        | Severity | Mitigation                                                                                                                                                      |
| ----------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Replay-handler determinism violations corrupt task state    | high     | `ctx.*` helpers, ESLint rule, loud documentation. Out-of-band: a non-deterministic handler is an app bug; framework cannot fully prevent it.                    |
| Visibility timeout tuned wrong → tasks reclaimed mid-run    | medium   | Per-task-type `visibilityTimeoutMs`; heartbeat auto-on-progress; telemetry for premature reclaims.                                                              |
| Blob lifecycle drift (sweeper deletes a blob still in use)  | medium   | Sweeper only deletes blobs of terminal tasks; new tasks must `consumedBlobs.push(...)` to claim a blob ownership; `deleted` blobs surface as missing on get.    |
| Fleet cap enforcement bug → fleet thrash under contention   | medium   | Adapter integration tests with simulated worker churn; Lua atomicity tests; degrade-loud telemetry when cap not honored.                                        |
| DAG cycles via mis-coded handlers                           | low      | Detect cycle via `parentTaskId` walk on `spawnChild`; refuse with clear error.                                                                                  |
| Replay log bloat on long-running parents                    | medium   | `events` capped per task; replay log is a separate field with separate cap; documented constraint that very-many-children DAGs should bucket via grandchildren. |
| Schema-version skew across mid-flight tasks during deploys  | medium   | `handlerVersion` + `compatibleVersions` gating; documented dual-accept release window mirroring `BusMessage.v`.                                                 |
| S3 multipart upload misuse → orphaned uploads cost money    | medium   | S3 adapter sets bucket lifecycle rule (abort multipart > 24 h) at boot when `manageLifecycle: true` (default); doc otherwise.                                   |
| Filesystem blob-store accidentally bound in multi-node prod | high     | Hard-refuse boot when paired with a multi-node queue adapter (§9). Misconfig fails loudly.                                                                      |
| Workers without GPU pulling encode tasks                    | low      | `tags` declaration + matching at claim time; tests assert.                                                                                                      |
| Idempotency-key collision across tenants                    | low      | Key namespace = `(submitterIdentity, key)` not just key.                                                                                                        |
| Heartbeat write load on the dataset                         | medium   | Cold-lane progress write is coalesced (1 Hz default); heartbeat does not write to the dataset, only refreshes broker-side visibility deadline.                  |

## 15. Out of scope

- **Workflow orchestration** in the Temporal / AWS Step Functions sense
  (saga compensation primitives, human-task signals, child workflow
  policies, search attributes, signal-with-start). The runner provides
  DAG composition; full workflow semantics are a separate primitive.
- **Cron / recurring scheduling.** Apps build cron on top by submitting
  from a scheduler (`setInterval`, an external cron container, etc.).
- **Priority lanes / fair scheduling / quotas.** v1 is FIFO per
  `(type, tags)` lane plus optional fleet cap. Revisit when a real
  workload demands it.
- **Progressive / streaming output during execution.** Tasks produce a
  final blob set; consumers wait for terminal `succeeded`. Apps that
  need HLS-style progressive output build it as a multi-task pipeline
  (each segment = a child task; segment-completed events drive a
  manifest writer). The blob-store + DAG primitives are sufficient;
  the runner does not add a streaming concept.
- **VM-sandboxed handler determinism.** `ctx.*` helpers + lint rule are
  the only enforcement. Apps with hard correctness needs use a dedicated
  workflow engine.
- **Automatic compensation / saga rollback.** Handlers may catch
  `awaitChildren` failures and run their own cleanup; the framework
  does not provide compensation primitives.
- **Cross-region active-active replication.** Tasks belong to the broker
  they were submitted to. DR strategies are an ops concern.
- **Distributed locks for shared resources** beyond the fleet cap. Apps
  that need fine-grained mutual exclusion across tasks build it on the
  cross-node bus or a dedicated lock service.
- **First-class Shades UI components** (task list, DAG tree view,
  upload widget). Ships later as `@furystack/shades-task-runner`,
  not v1 release scope.
- **Kafka / RabbitMQ queue adapters.** Listed as future options; not
  v1 implementation targets.
- **Strongly-consistent state replication / event sourcing.** This is a
  task primitive, not a state store; apps still own their persistent
  data via `@furystack/repository` + `defineStore`.
- **Distributed tracing fan-out across child tasks.** v1 emits
  per-task telemetry events; binding them into a single trace tree via
  OpenTelemetry context propagation is a v1.x improvement.

## 16. Open questions

These are intentionally left for the implementer to settle during
development; none of them gate the v1 plan.

1. **Replay log placement.** _Settled — separate `TaskReplayLog`
   dataset_, one entity per recorded step keyed by
   `(taskId, stepIndex)`. Inline-on-Task was rejected because
   long-running parents with heavy `awaitChildren` fan-out hit
   Mongo's 16MB row cap and rewrite the entire log on every status
   update. The separate dataset keeps `Task` as a small "control
   plane" record, lets the sweeper drop `WHERE taskId = X` on TTL,
   and rides the same `defineDataSet` plumbing as everything else.
   Crash mid-write is recoverable in either order: the
   `(taskId, stepIndex)` key dedups replay-time `spawnChild` reruns
   against an existing child Task row.
2. **Child task cleanup of failed parents.** When a parent fails after
   children succeeded, do their blobs get cleaned up under the parent's
   `onFailure` policy? Proposed default: child tasks own their own
   retention; parent failure does not retroactively rewrite child
   policy. Confirm with M5 sweeper design.
3. **`awaitChildren` partial-results API.** Should the await resolve
   even if some children failed (returning a `PromiseSettledResult`-like
   shape) so handlers can decide per child? Current shape rejects on
   any failure; a `awaitChildrenSettled` variant could land in v1.x.
4. **Filesystem adapter URL expiry.** _Settled — HMAC-SHA256 stateless
   tokens_ signed with a constructor-provided secret (≥ 32 characters
   or bytes, enforced at construction). Token payload encodes
   `{ key, op: 'download' | 'upload', expiry, contentType?, maxBytes?,
nonce }` and is verified by the `endpoints` subpath helper before
   any disk I/O. Stateless beats the cache-stored alternative because
   URLs survive process restarts and there is no extra storage to
   reason about; the trade-off is that revoking a single in-flight URL
   requires rotating the secret. Apps that need per-URL revocation can
   layer a tiny denylist cache in front of the helper.
5. **In-process queue replay log persistence.** _Settled — 30 s
   reconciler default for in-process._ The §7.4 continuation flow
   handles crash recovery: dataset is the source of truth; crash
   mid-`spawnChild` before the dataset write means the parent re-runs
   from the top, hits `spawnChild` again, the `(taskId, stepIndex)`
   key on `TaskReplayLog` dedups the step record. The reconciler is
   the safety net for missed parent wake-ups. 30 s (not 1 h) was
   chosen for the in-process adapter because the queue is volatile —
   a restart needs stuck `waiting` parents re-enqueued within a
   reasonable window for dev/test ergonomics. The interval is
   configurable via `InProcessTaskRunnerOptions.reconcilerIntervalMs`.
6. **Worker self-throttle on broker latency.** If submit-to-claim
   latency rises, should workers slow down their claim rate to give
   slow tasks a chance to heartbeat? Out of scope for v1 plain FIFO,
   but a hook (`onClaimLagDetected`) might land.
7. **Blob multipart upload helper API.** _Settled for v1 — single-part
   PUT only._ The S3 adapter uses raw `PutObjectCommand` (capability
   `multipart: false`, `maxObjectBytes: 5 GiB`). Reasons: (a) the
   `@aws-sdk/lib-storage` `Upload` reaches into `S3Client.config`
   internals that resist clean stubbing in unit tests, (b) the typical
   FuryStack workload (documents, video chunks, thumbnails) fits well
   under the 5 GiB single-part cap, and (c) apps with very-large-blob
   needs (full mezzanine video files, large dataset dumps) can compose
   `lib-storage`'s `Upload` themselves on the underlying `S3Client`
   and pass the resulting key back as a `BlobRef`. v1.x will introduce
   a multipart-aware `put` variant on the core interface and lift the
   capability flag — that lift is the breaking-change boundary, so
   apps can opt in.

## 17. Dependencies & related work

- **`@furystack/cross-node-bus` v1** — the runner publishes task
  status/progress on the bus via the hot-lane. Capability requirement:
  any non-trivial deployment shape requires the bus running on a
  cross-node-capable adapter (in-process bus is fine for single-pod;
  Redis/NATS/etc. for multi-node). See
  `cross-node-bus-spike.md` for adapter selection.
- **`@furystack/repository` + `defineStore`** — task state lives in a
  `defineDataSet` over the app's chosen store. Reuses every existing
  store adapter (filesystem, mongodb, redis, sequelize) without
  modification.
- **`@furystack/entity-sync-service`** — the WS subscribe path for task
  updates rides on the existing entity-sync transport, sharing the
  same socket and authentication scope. Terminal-state changes
  propagate through entity-sync's `onEntityUpdated` path automatically.
- **`@furystack/security`** — authorizers enforce per-task-type access
  control on the runner's REST endpoints.
- **`@furystack/cache`** — task lookup endpoints (`GET /tasks/:id`)
  may use `Cache` over the dataset for hot tasks; tag-based
  invalidation off `task:${id}` keeps cache coherent. Optional.
- **`docs/internal/functional-di-migration-plan.md`** — established
  the "interface + token + factory" pattern this PRD follows for
  `TaskRunner`, `BlobStore`, every adapter helper, and every facade.
- **`@furystack/utils` `EventHub<T>`** — the runner composes an internal
  `EventHub` for typed in-process subscription dispatch and listener
  error isolation, bridging out to the bus the same way the bus PRD's
  `IdentityEventBus` does.
- **`@furystack/eslint-plugin`** — gains a new rule
  (`no-non-deterministic-globals-in-handler`) flagging `Date.now`,
  `Math.random`, `setTimeout`, `setInterval`, `fetch`, and `crypto`
  references inside `defineTaskHandler` factory bodies.
