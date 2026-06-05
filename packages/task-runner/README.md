# @furystack/task-runner

Transport-agnostic primitive for submitting, running, and observing
distributed tasks in a FuryStack app: long, expensive, or network-bound
work that must run outside the request/response path (video encoding,
report generation, batch ETL, scheduled maintenance, …).

It owns the abstraction — the `TaskRunner` token, the task entity schema,
the handler/worker DSL, DAG composition (`spawnChild` / `awaitChildren`),
and the replay-based continuation engine. The default queue adapter runs
in-process; production transports ship in their own packages
(`@furystack/redis-task-runner`). Task state persists through a
`defineDataSet` over any `defineStore` adapter, and progress fans out over
`@furystack/cross-node-bus`.

See `docs/internal/distributed-task-management.md` for the full design.

## Installation

```bash
npm install @furystack/task-runner
# or
yarn add @furystack/task-runner
```

## Getting started

Define a handler, register a worker, bind the in-process runner, and
submit. The in-process runner needs a `BlobStore` bound (its default
factory throws); the cross-node bus, task datasets, and telemetry all have
in-process defaults, so single-node setups bind only those two tokens.

```ts
import { createInjector } from '@furystack/inject'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { TaskRunner, defineInProcessTaskRunner, defineTaskHandler, defineWorker } from '@furystack/task-runner'

const greet = defineTaskHandler<{ name: string }, { message: string }>({
  type: 'greet',
  version: 1,
  handler: async (ctx, { name }) => {
    ctx.reportProgress({ percent: 50 })
    return { message: `Hello, ${name}!` }
  },
})

const GreetWorker = defineWorker({
  name: 'my-app/GreetWorker',
  types: [greet],
  concurrency: 2,
})

await using injector = createInjector()

injector.bind(BlobStore, ({ onDispose }) => {
  const store = new InMemoryBlobStore({ name: 'blobs' })
  // eslint-disable-next-line furystack/prefer-using-wrapper -- disposal delegated to onDispose
  onDispose(() => store[Symbol.dispose]())
  return store
})
injector.bind(TaskRunner, defineInProcessTaskRunner())

injector.get(GreetWorker) // resolving registers the worker and starts claiming

const runner = injector.get(TaskRunner)
const task = await runner.submit({ type: 'greet', payload: { name: 'world' }, handlerVersion: 1 })

using subscription = runner.subscribe(task.id, (update) => {
  console.log(update)
})
```

## Core concepts

| Concept           | What it is                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Handler**       | A replay-safe async function authored with `defineTaskHandler`, keyed by a `type` discriminator and a `version`. Receives a `TaskContext` and the typed payload.              |
| **Worker**        | A `defineWorker` token. Resolving it registers its handlers with the bound `TaskRunner` and starts claiming matching tasks; disposing the injector drains and unregisters it. |
| **Runner**        | The `TaskRunner` token: `submit` / `draft` / `start` / `cancel` / `get` / `getTree` / `subscribe` / `registerWorker`, plus a `capabilities` matrix.                           |
| **Queue adapter** | The claim/ack/heartbeat/reclaim transport. In-process by default; `@furystack/redis-task-runner` for multi-node.                                                              |
| **Task**          | The persisted control-plane row (status, attempts, events, DAG edges, blob refs, retention). Lives in `TaskDataSet`.                                                          |

### DAG composition

A handler composes a DAG by spawning children and awaiting them. The
handler re-runs from the top on continuation (after children terminate or
after a crash); `ctx.*` helpers and the replay log make that re-execution
deterministic, so spawning the same children twice is deduped.

```ts
import { defineTaskHandler } from '@furystack/task-runner'

const scanAll = defineTaskHandler<{ datasetIds: string[] }, { findings: number }>({
  type: 'scan-all',
  version: 1,
  handler: async (ctx, { datasetIds }) => {
    const handles = await Promise.all(datasetIds.map((id) => ctx.spawnChild<string, number>('scan', id)))
    const counts = await ctx.awaitChildren(handles)
    return { findings: counts.reduce((sum, n) => sum + n, 0) }
  },
})
```

Use `ctx.awaitChildrenSettled(handles)` instead of `ctx.awaitChildren` to
get a per-child `SettledChildResult` (succeeded / failed / cancelled)
rather than rejecting on the first non-succeeded child.

### Determinism (replay safety)

Because handlers re-run on continuation, side effects that differ between
runs corrupt task state. Use the determinism-safe context helpers —
`ctx.now()`, `ctx.random()`, `ctx.sleep()`, `ctx.fetch()` — instead of
`Date.now()`, `Math.random()`, `setTimeout`, or the global `fetch`. Their
results are recorded on the replay log and replayed identically.

### Blobs

Tasks reference large binaries through `@furystack/blob-store`. A handler
allocates an output blob ref with `ctx.allocateBlob('out.mp4', { contentType: 'video/mp4' })`,
writes to it via `ctx.blobStore`, and records ownership on its task row so
the retention sweeper and download endpoints can find it.

## Adapters & deployment

- **In-process** (`defineInProcessTaskRunner`) — everything lives in the
  process; no broker. Tests, local dev, single-node.
- **Redis Streams** (`@furystack/redis-task-runner`) — persistent,
  broker-side-reclaimable, fleet-cap-enforcing, multi-node. Pair it with a
  cross-node-capable bus (`@furystack/redis-cross-node-bus`) and a
  cross-node-accessible blob store (`@furystack/s3-blob-store`).

## REST + WS surface

The `@furystack/task-runner/endpoints` subpath mounts the HTTP/WS API
(`POST /tasks` + upload tickets, `POST /tasks/:id/start`, `GET /tasks/:id`,
`GET /tasks/:id/tree`, `DELETE /tasks/:id`, `GET /tasks/:id/download`, and a
`/tasks-socket` live-progress channel). The browser-side SDK is
`@furystack/task-runner-client`.

## Blob retention sweeper

`defineTaskBlobSweeper` is a background service that deletes blobs of
terminal tasks past their retention TTL, honoring each task's own
`retentionPolicy`. Configure scan interval and batch size; telemetry hooks
report each run.

## Testing

The `@furystack/task-runner/testing` subpath ships `createTestRunner`, a
self-contained in-memory runner with optional pre-registered handlers, and
`runTaskToCompletion` for driving a task to a terminal status in a test.

## Capabilities

`TaskRunner.capabilities` declares what the bound queue adapter supports
(`persistent`, `fleetCapEnforcement`, `delayedDispatch`, `maxPayloadBytes`).
`assertCapabilities` fails loudly at boot when a deployment shape is
incompatible (e.g. a single-node blob store paired with a multi-node queue).
