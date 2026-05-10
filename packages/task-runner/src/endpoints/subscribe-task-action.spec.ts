import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInjector, type Injector } from '@furystack/inject'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { CrossNodeBus } from '@furystack/cross-node-bus'
import { HttpUserContext } from '@furystack/rest-service'
import type { User } from '@furystack/core'
import type { IncomingMessage } from 'node:http'
import type WebSocket from 'ws'
import { defineInProcessTaskRunner } from '../in-process-task-runner.js'
import { defineTaskHandler } from '../define-task-handler.js'
import { TaskRunner } from '../task-runner.js'
import type { TaskUpdate } from '../types.js'
import { createSubscribeTaskAction } from './subscribe-task-action.js'

const ECHO = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

const ADMIN_USER: User = { username: 'admin', roles: ['admin'] }

type FakeSocket = WebSocket & {
  send: ReturnType<typeof vi.fn>
  closeListeners: Array<() => void>
}

const buildFakeSocket = (): FakeSocket => {
  const closeListeners: Array<() => void> = []
  const send = vi.fn(() => undefined)
  const on = (event: string, listener: () => void): unknown => {
    if (event === 'close') closeListeners.push(listener)
    return undefined
  }
  return {
    readyState: 1,
    send,
    on,
    closeListeners,
  } as unknown as FakeSocket
}

const buildInjector = (currentUser: User | null): Injector => {
  const injector = createInjector()
  injector.bind(BlobStore, ({ onDispose }) => {
    const store = new InMemoryBlobStore({ name: 'sub-spec' })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
    onDispose(() => store[Symbol.dispose]())
    return store
  })
  injector.bind(TaskRunner, defineInProcessTaskRunner({ reconcilerIntervalMs: 100, sweepIntervalMs: 100 }))
  injector.bind(HttpUserContext, () => {
    return {
      isAuthenticated: async () => currentUser !== null,
      isAuthorized: async (_req: unknown, ...roles: string[]) => {
        if (!currentUser) return false
        return roles.every((role) => currentUser.roles.some((c) => c === role))
      },
      getCurrentUser: async () => currentUser,
    } as unknown as HttpUserContext
  })
  return injector
}

const sentMessages = (socket: FakeSocket): unknown[] => {
  const calls = (socket.send as ReturnType<typeof vi.fn>).mock.calls as Array<[string]>
  return calls.map(([raw]) => JSON.parse(raw) as unknown)
}

describe('createSubscribeTaskAction', () => {
  let injector: Injector

  afterEach(async () => {
    if (injector) await injector[Symbol.asyncDispose]()
  })

  it('canExecute matches subscribe-task and unsubscribe-task envelopes', () => {
    injector = buildInjector(ADMIN_USER)
    const action = createSubscribeTaskAction()
    const sock = buildFakeSocket()
    const req = {} as IncomingMessage
    expect(
      action.canExecute({
        data: JSON.stringify({ type: 'subscribe-task', requestId: 'r', taskId: 't' }),
        request: req,
        socket: sock,
      }),
    ).toBe(true)
    expect(
      action.canExecute({
        data: JSON.stringify({ type: 'unsubscribe-task', subscriptionId: 's' }),
        request: req,
        socket: sock,
      }),
    ).toBe(true)
    expect(action.canExecute({ data: JSON.stringify({ type: 'unrelated' }), request: req, socket: sock })).toBe(false)
    expect(action.canExecute({ data: 'not-json', request: req, socket: sock })).toBe(false)
  })

  it('replies with subscribed-task carrying the snapshot, then forwards bus updates', async () => {
    injector = buildInjector(ADMIN_USER)
    const runner = injector.get(TaskRunner)
    const bus = injector.get(CrossNodeBus)
    runner.registerWorker({ name: 'w', handlers: [ECHO], concurrency: 1, tags: [], compatibleVersions: {} })
    const draft = await runner.draft({ type: 'echo', payload: {}, handlerVersion: 1 })

    const action = createSubscribeTaskAction()
    const sock = buildFakeSocket()
    const req = {} as IncomingMessage
    await action.execute({
      data: JSON.stringify({ type: 'subscribe-task', requestId: 'r1', taskId: draft.id }),
      request: req,
      socket: sock,
      injector,
    })

    const sent = sentMessages(sock)
    expect(sent[0]).toMatchObject({ type: 'subscribed-task', requestId: 'r1' })

    const update: TaskUpdate = { kind: 'progress', taskId: draft.id, percent: 42, at: new Date().toISOString() }
    await bus.publish('tasks/progress/echo', update)

    const lastSent = sentMessages(sock)
    expect(lastSent[lastSent.length - 1]).toMatchObject({ type: 'task-update', kind: 'progress', percent: 42 })
  })

  it('drops bus events for other taskIds', async () => {
    injector = buildInjector(ADMIN_USER)
    const runner = injector.get(TaskRunner)
    const bus = injector.get(CrossNodeBus)
    const draft = await runner.draft({ type: 'echo', payload: {}, handlerVersion: 1 })

    const action = createSubscribeTaskAction()
    const sock = buildFakeSocket()
    await action.execute({
      data: JSON.stringify({ type: 'subscribe-task', requestId: 'r2', taskId: draft.id }),
      request: {} as IncomingMessage,
      socket: sock,
      injector,
    })
    sock.send.mockClear()

    const otherUpdate: TaskUpdate = {
      kind: 'progress',
      taskId: 'some-other-task',
      percent: 99,
      at: new Date().toISOString(),
    }
    await bus.publish('tasks/progress/echo', otherUpdate)
    expect(sock.send).not.toHaveBeenCalled()
  })

  it('replies with subscription-error when authorization fails', async () => {
    injector = buildInjector(null)
    const runner = injector.get(TaskRunner)
    const draft = await runner.draft({ type: 'echo', payload: {}, handlerVersion: 1 })
    const action = createSubscribeTaskAction()
    const sock = buildFakeSocket()
    await action.execute({
      data: JSON.stringify({ type: 'subscribe-task', requestId: 'r3', taskId: draft.id }),
      request: {} as IncomingMessage,
      socket: sock,
      injector,
    })
    const sent = sentMessages(sock)
    expect(sent[0]).toMatchObject({ type: 'subscription-error', requestId: 'r3' })
  })

  it('replies with subscription-error when task is not found', async () => {
    injector = buildInjector(ADMIN_USER)
    const action = createSubscribeTaskAction()
    const sock = buildFakeSocket()
    await action.execute({
      data: JSON.stringify({ type: 'subscribe-task', requestId: 'r4', taskId: 'missing' }),
      request: {} as IncomingMessage,
      socket: sock,
      injector,
    })
    const sent = sentMessages(sock)
    expect(sent[0]).toMatchObject({ type: 'subscription-error', requestId: 'r4' })
  })

  it('unsubscribe disposes bus subscriptions and stops forwarding', async () => {
    injector = buildInjector(ADMIN_USER)
    const runner = injector.get(TaskRunner)
    const bus = injector.get(CrossNodeBus)
    const draft = await runner.draft({ type: 'echo', payload: {}, handlerVersion: 1 })

    const action = createSubscribeTaskAction()
    const sock = buildFakeSocket()
    await action.execute({
      data: JSON.stringify({ type: 'subscribe-task', requestId: 'r5', taskId: draft.id }),
      request: {} as IncomingMessage,
      socket: sock,
      injector,
    })

    const subscribedMsg = sentMessages(sock)[0] as { subscriptionId: string }
    sock.send.mockClear()

    await action.execute({
      data: JSON.stringify({ type: 'unsubscribe-task', subscriptionId: subscribedMsg.subscriptionId }),
      request: {} as IncomingMessage,
      socket: sock,
      injector,
    })

    const update: TaskUpdate = {
      kind: 'progress',
      taskId: draft.id,
      percent: 75,
      at: new Date().toISOString(),
    }
    await bus.publish('tasks/progress/echo', update)
    expect(sock.send).not.toHaveBeenCalled()
  })

  it('socket close sweeps every outstanding subscription', async () => {
    injector = buildInjector(ADMIN_USER)
    const runner = injector.get(TaskRunner)
    const bus = injector.get(CrossNodeBus)
    const draft = await runner.draft({ type: 'echo', payload: {}, handlerVersion: 1 })

    const action = createSubscribeTaskAction()
    const sock = buildFakeSocket()
    await action.execute({
      data: JSON.stringify({ type: 'subscribe-task', requestId: 'r6', taskId: draft.id }),
      request: {} as IncomingMessage,
      socket: sock,
      injector,
    })

    sock.send.mockClear()
    for (const listener of sock.closeListeners) listener()

    const update: TaskUpdate = {
      kind: 'progress',
      taskId: draft.id,
      percent: 99,
      at: new Date().toISOString(),
    }
    await bus.publish('tasks/progress/echo', update)
    expect(sock.send).not.toHaveBeenCalled()
  })
})
