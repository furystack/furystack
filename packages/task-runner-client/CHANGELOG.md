# Changelog

## [1.0.1] - 2026-08-26

### ⬆️ Dependencies

- Updated `ws` to `^8.21.1`
- Updated dependencies
- Raised dev `typescript` to `^7.0.2` and `vitest` to `^4.1.10`. No functional changes — dev-tooling and Prettier formatting updates only.

## [1.0.0] - 2026-06-05

### 💥 Breaking Changes

### First public release — initial stable API surface

First public release of `@furystack/task-runner-client`, published as a major to establish the package's stable, SemVer-governed public API. There is no prior published version to migrate from; everything documented below under **Features** is part of this initial surface.

**Impact:** New consumers only — there is no migration path because no earlier version was published.

### ✨ Features

### Initial release — browser-side SDK for the distributed task runner

Client SDK that consumes the REST + WebSocket surface mounted by `useTaskRunnerEndpoints` from `@furystack/task-runner/endpoints`.

- `defineTaskRunnerClient(options)` mints a per-app singleton DI token; `TaskRunnerClient` can also be constructed directly (e.g. in tests with a custom `fetchImpl` / `createWebSocket`).
- `submitTask` runs the two-phase draft → upload → start flow under the hood. Pass `uploads` to push each blob slot to its presigned ticket and `resolvePayload` to fold the uploaded keys into the final payload before starting.
- `getTask` (returns `undefined` when not found), `getTaskTree` (parent + descendants), and `cancelTask` (cascades server-side).
- `subscribeProgress(taskId)` returns a disposable `LiveTask` whose `state` observable folds the WebSocket snapshot together with the hot-lane update stream. Requires `wsUrl`.
- `uploadBlob` is exported standalone and transparently handles both presigned-direct (`PUT`) and POST-policy (`POST` + `fields`) tickets.
- `TaskRunnerClientError` carries the server-supplied `code` and HTTP `status` for exhaustive branching on REST/upload failures.

```typescript
import { createInjector } from '@furystack/inject'
import { defineTaskRunnerClient } from '@furystack/task-runner-client'

export const AppTasks = defineTaskRunnerClient({
  rootUrl: 'http://localhost:8080/tasks',
  wsUrl: 'ws://localhost:8080/tasks-socket',
})

const client = createInjector().get(AppTasks)
const task = await client.submitTask({ type: 'echo', payload: { value: 'hello' }, handlerVersion: 1 })
```

The WebSocket transport is created lazily, shared across subscriptions, auto-reconnects with exponential backoff (`reconnectBaseMs` / `reconnectMaxMs` / `maxReconnectAttempts`), and re-issues active subscriptions on reconnect.
