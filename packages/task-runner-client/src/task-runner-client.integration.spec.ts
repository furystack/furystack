import { afterEach, describe, expect, it } from 'vitest'
import { createInjector, type Injector } from '@furystack/inject'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import {
  HttpAuthenticationSettings,
  defaultHttpAuthenticationSettings,
  type AuthenticationProvider,
} from '@furystack/rest-service'
import type { User } from '@furystack/core'
import { getPort } from '@furystack/core/port-generator'
import { WebSocket as NodeWebSocket } from 'ws'
import { defineInProcessTaskRunner, defineTaskHandler, TaskRunner } from '@furystack/task-runner'
import { useTaskRunnerEndpoints } from '@furystack/task-runner/endpoints'
import type { ObservableValue } from '@furystack/utils'
import { TaskRunnerClient } from './task-runner-client.js'
import type { TaskSubscriptionState } from './types.js'

const ECHO = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

const ADMIN_USER: User = { username: 'admin', roles: ['admin'] }

const buildInjector = (currentUser: User | null): Injector => {
  const injector = createInjector()
  injector.bind(BlobStore, ({ onDispose }) => {
    const store = new InMemoryBlobStore({ name: 'client-integration' })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
    onDispose(() => store[Symbol.dispose]())
    return store
  })
  injector.bind(TaskRunner, defineInProcessTaskRunner({ reconcilerIntervalMs: 100, sweepIntervalMs: 100 }))
  const provider: AuthenticationProvider = { name: 'fake-test-provider', authenticate: async () => currentUser }
  injector.bind(HttpAuthenticationSettings, () => ({
    ...defaultHttpAuthenticationSettings(),
    authenticationProviders: [provider],
  }))
  return injector
}

const createClient = (port: number): TaskRunnerClient =>
  new TaskRunnerClient({
    rootUrl: `http://localhost:${port}/tasks`,
    wsUrl: `ws://localhost:${port}/tasks-socket`,
    createWebSocket: (url) => new NodeWebSocket(url) as unknown as WebSocket,
  })

const waitFor = (
  state: ObservableValue<TaskSubscriptionState>,
  predicate: (s: TaskSubscriptionState) => boolean,
  timeoutMs = 4000,
): Promise<TaskSubscriptionState> =>
  new Promise((resolve, reject) => {
    const current = state.getValue()
    if (predicate(current)) {
      resolve(current)
      return
    }
    const timer = setTimeout(() => {
      observer[Symbol.dispose]()
      reject(new Error('waitFor timed out'))
    }, timeoutMs)
    const observer = state.subscribe((next) => {
      if (predicate(next)) {
        clearTimeout(timer)
        observer[Symbol.dispose]()
        resolve(next)
      }
    })
  })

describe('TaskRunnerClient — integration', () => {
  let injector: Injector
  const clients: TaskRunnerClient[] = []

  afterEach(async () => {
    for (const c of clients.splice(0)) c[Symbol.dispose]()
    if (injector) await injector[Symbol.asyncDispose]()
  })

  it('submitTask drafts + starts and the task runs to completion', async () => {
    injector = buildInjector(ADMIN_USER)
    injector.get(TaskRunner).registerWorker({
      name: 'echo-worker',
      handlers: [ECHO],
      concurrency: 1,
      tags: [],
      compatibleVersions: {},
    })
    const port = getPort()
    await useTaskRunnerEndpoints({ injector, port })
    const client = createClient(port)
    clients.push(client)

    const task = await client.submitTask({ type: 'echo', payload: { value: 'hello' }, handlerVersion: 1 })
    expect(task.status).toBe('pending')

    let fetched = await client.getTask(task.id)
    for (let i = 0; i < 50 && fetched?.status !== 'succeeded'; i++) {
      await new Promise((r) => setTimeout(r, 50))
      fetched = await client.getTask(task.id)
    }
    expect(fetched?.status).toBe('succeeded')
    expect(fetched?.result).toEqual({ echoed: 'hello' })
  })

  it('subscribeProgress observes status updates through to succeeded', async () => {
    injector = buildInjector(ADMIN_USER)
    injector.get(TaskRunner).registerWorker({
      name: 'echo-worker',
      handlers: [ECHO],
      concurrency: 1,
      tags: [],
      compatibleVersions: {},
    })
    const port = getPort()
    await useTaskRunnerEndpoints({ injector, port })
    const client = createClient(port)
    clients.push(client)

    const { task } = await client.draftTask({ type: 'echo', payload: { value: 'x' }, handlerVersion: 1 })

    using live = client.subscribeProgress(task.id)
    await waitFor(live.state, (s) => s.status === 'subscribed')

    await client.startTask(task.id, { value: 'final' })

    const terminal = await waitFor(live.state, (s) => s.status === 'subscribed' && s.task.status === 'succeeded')
    expect(terminal.status === 'subscribed' && terminal.task.status).toBe('succeeded')
  })

  it('cancelTask cancels a draft', async () => {
    injector = buildInjector(ADMIN_USER)
    const port = getPort()
    await useTaskRunnerEndpoints({ injector, port })
    const client = createClient(port)
    clients.push(client)

    const { task } = await client.draftTask({ type: 'echo', payload: { value: 'x' }, handlerVersion: 1 })
    await client.cancelTask(task.id, 'manual')
    const after = await client.getTask(task.id)
    expect(after?.status).toBe('cancelled')
  })
})
