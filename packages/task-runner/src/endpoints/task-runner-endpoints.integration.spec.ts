import { afterEach, describe, expect, it } from 'vitest'
import { createInjector, type Injector } from '@furystack/inject'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { HttpAuthenticationSettings, defaultHttpAuthenticationSettings } from '@furystack/rest-service'
import type { AuthenticationProvider } from '@furystack/rest-service'
import type { User } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { WebSocket } from 'ws'
import { defineInProcessTaskRunner } from '../in-process-task-runner.js'
import { defineTaskHandler } from '../define-task-handler.js'
import { TaskRunner } from '../task-runner.js'
import type { Task } from '../types.js'
import { useTaskRunnerEndpoints } from './use-task-runner-endpoints.js'
import type { ServerTaskMessage } from './subscribe-task-action.js'

const ECHO = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

const ADMIN_USER = { username: 'admin', roles: ['admin'] }

/**
 * Fake authentication provider that always returns the configured user.
 * Plugged into `HttpAuthenticationSettings` (a singleton) so every per-request
 * `HttpUserContext` resolution sees it — works around scoped binding visibility
 * (per-scope `bind` doesn't propagate to descendant scopes).
 */
const buildInjector = (currentUser: User | null): Injector => {
  const injector = createInjector()
  injector.bind(BlobStore, ({ onDispose }) => {
    const store = new InMemoryBlobStore({ name: 'integration' })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
    onDispose(() => store[Symbol.dispose]())
    return store
  })
  injector.bind(TaskRunner, defineInProcessTaskRunner({ reconcilerIntervalMs: 100, sweepIntervalMs: 100 }))

  const provider: AuthenticationProvider = {
    name: 'fake-test-provider',
    authenticate: async () => currentUser,
  }
  injector.bind(HttpAuthenticationSettings, () => ({
    ...defaultHttpAuthenticationSettings(),
    authenticationProviders: [provider],
  }))
  return injector
}

describe('useTaskRunnerEndpoints — integration', () => {
  let injector: Injector

  afterEach(async () => {
    if (injector) await injector[Symbol.asyncDispose]()
  })

  it('full happy path: POST draft → start → run → subscribe receives updates', async () => {
    injector = buildInjector(ADMIN_USER)
    const runner = injector.get(TaskRunner)
    runner.registerWorker({ name: 'echo-worker', handlers: [ECHO], concurrency: 1, tags: [], compatibleVersions: {} })

    const port = getPort()
    await useTaskRunnerEndpoints({ injector, port })

    const draftRes = await fetch(`http://localhost:${port}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'echo', payload: { value: 'placeholder' }, handlerVersion: 1 }),
    })
    expect(draftRes.status).toBe(201)
    const { task } = (await draftRes.json()) as { task: Task }
    expect(task.status).toBe('draft')

    // Open a WS subscription before starting the task — the client must
    // observe progress + terminal status.
    const ws = await new Promise<WebSocket>((resolve, reject) => {
      const sock = new WebSocket(`ws://localhost:${port}/tasks-socket`)
      sock.once('open', () => resolve(sock))
      sock.once('error', reject)
    })

    const received: ServerTaskMessage[] = []
    const terminal = new Promise<void>((resolve) => {
      ws.on('message', (raw: Buffer) => {
        const msg = JSON.parse(raw.toString('utf-8')) as ServerTaskMessage
        received.push(msg)
        if (msg.type === 'task-update' && msg.kind === 'status' && msg.status === 'succeeded') {
          resolve()
        }
      })
    })

    ws.send(JSON.stringify({ type: 'subscribe-task', requestId: 'r1', taskId: task.id }))

    // Wait briefly for the subscribed-task ack so the bus subs are live.
    await new Promise<void>((r) => setTimeout(r, 30))

    const startRes = await fetch(`http://localhost:${port}/tasks/${task.id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { value: 'final' } }),
    })
    expect(startRes.status).toBe(200)
    const startedTask = (await startRes.json()) as Task
    expect(startedTask.status).toBe('pending')
    expect(startedTask.payload).toEqual({ value: 'final' })

    await terminal

    expect(received.some((m) => m.type === 'subscribed-task')).toBe(true)
    expect(received.some((m) => m.type === 'task-update' && m.kind === 'status' && m.status === 'succeeded')).toBe(true)

    ws.close()
  })

  it('GET task details + cancel via DELETE', async () => {
    injector = buildInjector(ADMIN_USER)
    const port = getPort()
    await useTaskRunnerEndpoints({ injector, port })
    const runner = injector.get(TaskRunner)

    const draft = await runner.draft({ type: 'echo', payload: { value: 'x' }, handlerVersion: 1 })

    const getRes = await fetch(`http://localhost:${port}/tasks/${draft.id}`)
    expect(getRes.status).toBe(200)
    const fetched = (await getRes.json()) as Task
    expect(fetched.id).toBe(draft.id)

    const delRes = await fetch(`http://localhost:${port}/tasks/${draft.id}?reason=manual`, { method: 'DELETE' })
    expect(delRes.status).toBe(204)

    const after = await runner.get(draft.id)
    expect(after?.status).toBe('cancelled')
  })
})
