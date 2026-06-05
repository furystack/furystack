# @furystack/task-runner-client

Browser-side SDK for the FuryStack distributed task runner. Consumes the
REST + WebSocket surface mounted by `useTaskRunnerEndpoints` from
`@furystack/task-runner/endpoints`: submit tasks (with the two-phase
draft → upload → start flow), query and cancel them, upload blobs to
presigned tickets, and subscribe to live progress over WebSocket.

## Installation

```bash
npm install @furystack/task-runner-client
# or
yarn add @furystack/task-runner-client
```

## Setup

`defineTaskRunnerClient(options)` mints a per-app singleton token. Declare
it once at module scope and reuse it.

```ts
import { createInjector } from '@furystack/inject'
import { defineTaskRunnerClient } from '@furystack/task-runner-client'

export const AppTasks = defineTaskRunnerClient({
  rootUrl: 'http://localhost:8080/tasks',
  wsUrl: 'ws://localhost:8080/tasks-socket',
})

const injector = createInjector()
const client = injector.get(AppTasks)
```

You can also construct `TaskRunnerClient` directly (e.g. in tests with a
custom `fetchImpl` / `createWebSocket`).

### Options

```ts
type TaskRunnerClientOptions = {
  rootUrl: string // REST root, e.g. 'http://host/tasks'
  wsUrl?: string // required only for subscribeProgress
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>
  createWebSocket?: (url: string) => WebSocket
  reconnect?: boolean // Default: true
  reconnectBaseMs?: number // Default: 1000
  reconnectMaxMs?: number // Default: 30000
  maxReconnectAttempts?: number // Default: Infinity
}
```

## Submitting tasks

Simple submit (draft + start under the hood):

```ts
const task = await client.submitTask({
  type: 'echo',
  payload: { value: 'hello' },
  handlerVersion: 1,
})
```

With blob uploads — the client drafts the task, uploads each slot to its
presigned ticket, then resolves the final payload before starting:

```ts
const task = await client.submitTask<{ blobKey?: string }>({
  type: 'video-encode',
  payload: {},
  handlerVersion: 1,
  uploads: {
    input: { body: file, contentType: 'video/mp4' },
  },
  resolvePayload: ({ payload, uploadedKeys }) => ({ ...payload, blobKey: uploadedKeys.input }),
})
```

`uploadBlob` handles both presigned-direct (`PUT`) and POST-policy
(`POST` + `fields`) tickets transparently and is exported standalone too.

## Querying & cancelling

```ts
const task = await client.getTask(taskId) // undefined when not found
const tree = await client.getTaskTree(taskId) // parent + descendants
await client.cancelTask(taskId, 'no longer needed') // cascades server-side
```

## Live progress

`subscribeProgress` returns a `LiveTask` whose `state` folds the WS
snapshot together with the hot-lane update stream. Requires `wsUrl`.

```ts
using live = client.subscribeProgress(taskId)

live.state.subscribe((state) => {
  if (state.status === 'subscribed') {
    console.log(state.task.status, state.task.progress?.percent)
  } else if (state.status === 'error') {
    console.error(state.error)
  }
})
```

Dispose the handle to unsubscribe. The underlying WebSocket transport is
created lazily, shared across subscriptions, auto-reconnects with
exponential backoff, and re-issues active subscriptions on reconnect.

## Errors

REST/upload failures throw `TaskRunnerClientError` carrying the
server-supplied `code` and the HTTP `status` for exhaustive branching.
