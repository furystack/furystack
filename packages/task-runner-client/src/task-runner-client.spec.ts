import { describe, expect, it, vi } from 'vitest'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { ServerTaskMessage, ClientTaskMessage } from '@furystack/task-runner/endpoints'
import type { Task } from '@furystack/task-runner'
import { TaskRunnerClient } from './task-runner-client.js'
import { TaskRunnerClientError } from './task-runner-client-error.js'
import { defineTaskRunnerClient } from './define-task-runner-client.js'
import type { FetchLike } from './upload-blob.js'

const ROOT = 'http://localhost/tasks'

const makeTask = (overrides: Partial<Task>): Task => ({
  id: 't1',
  type: 'echo',
  handlerVersion: 1,
  status: 'draft',
  payload: {},
  childTaskIds: [],
  submittedAt: new Date().toISOString(),
  attempts: [],
  events: [],
  producedBlobs: [],
  consumedBlobs: [],
  retentionPolicy: { onSuccess: 'keep', onFailure: 'keep', ttlAfterTerminalDays: 30 },
  tags: [],
  ...overrides,
})

const jsonResponse = (body: unknown, status = 200): Response =>
  ({ ok: status < 400, status, json: async () => body }) as Response

const okResponse = (status = 200): Response => ({ ok: status < 400, status }) as Response

const createMockWebSocket = () => {
  const instance = {
    sent: [] as ClientTaskMessage[],
    send(data: string) {
      this.sent.push(JSON.parse(data) as ClientTaskMessage)
    },
    close: vi.fn(),
    readyState: 0 as number,
    onopen: null as ((event: Event) => void) | null,
    onclose: null as ((event: CloseEvent) => void) | null,
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    simulateOpen() {
      this.readyState = 1
      this.onopen?.({} as Event)
    },
    simulateMessage(data: ServerTaskMessage) {
      this.onmessage?.({ data: JSON.stringify(data) } as MessageEvent)
    },
    simulateClose() {
      this.readyState = 3
      this.onclose?.({} as CloseEvent)
    },
  }
  return instance
}

type MockWebSocket = ReturnType<typeof createMockWebSocket>

describe('TaskRunnerClient', () => {
  describe('draftTask + startTask', () => {
    it('drafts via POST and starts via POST /:id/start', async () => {
      const draft = makeTask({ id: 'abc', status: 'draft' })
      const started = makeTask({ id: 'abc', status: 'pending', payload: { value: 'final' } })
      const fetchImpl = vi.fn<FetchLike>(async (url, init) => {
        if (url === ROOT && init?.method === 'POST') return jsonResponse({ task: draft, uploads: {} }, 201)
        if (url === `${ROOT}/abc/start`) return jsonResponse(started)
        throw new Error(`unexpected ${url}`)
      })
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })

      const draftRes = await client.draftTask({ type: 'echo', payload: { value: 'x' }, handlerVersion: 1 })
      expect(draftRes.task.id).toBe('abc')

      const result = await client.startTask('abc', { value: 'final' })
      expect(result.status).toBe('pending')
      const startInit = fetchImpl.mock.calls.find((c) => c[0] === `${ROOT}/abc/start`)?.[1]
      expect(JSON.parse(startInit?.body as string)).toEqual({ payload: { value: 'final' } })
    })

    it('serializes a Date notBefore to ISO-8601', async () => {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(jsonResponse({ task: makeTask({}), uploads: {} }, 201))
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })
      const when = new Date('2030-01-01T00:00:00.000Z')
      await client.draftTask({ type: 'echo', payload: {}, handlerVersion: 1, notBefore: when })
      const body = JSON.parse(fetchImpl.mock.calls[0][1]?.body as string) as { notBefore: string }
      expect(body.notBefore).toBe('2030-01-01T00:00:00.000Z')
    })
  })

  describe('submitTask', () => {
    it('drafts then starts when there are no uploads', async () => {
      const draft = makeTask({ id: 's1', status: 'draft' })
      const started = makeTask({ id: 's1', status: 'pending' })
      const fetchImpl = vi.fn<FetchLike>(async (url, init) => {
        if (url === ROOT && init?.method === 'POST') return jsonResponse({ task: draft, uploads: {} }, 201)
        if (url === `${ROOT}/s1/start`) return jsonResponse(started)
        throw new Error(`unexpected ${url}`)
      })
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })

      const result = await client.submitTask({ type: 'echo', payload: { value: 'a' }, handlerVersion: 1 })
      expect(result.id).toBe('s1')
      expect(result.status).toBe('pending')
    })

    it('uploads each slot and resolves the payload before start', async () => {
      const draft = makeTask({ id: 'u1', status: 'draft' })
      const ticket = { key: 'tasks/u1/uploads/input', url: 'https://blobs/put', method: 'PUT' as const }
      const started = makeTask({ id: 'u1', status: 'pending' })
      const uploads: string[] = []
      const fetchImpl = vi.fn<FetchLike>(async (url, init) => {
        if (url === ROOT && init?.method === 'POST') {
          return jsonResponse({ task: draft, uploads: { input: ticket } }, 201)
        }
        if (url === 'https://blobs/put') {
          uploads.push(init?.body as string)
          return okResponse()
        }
        if (url === `${ROOT}/u1/start`) return jsonResponse(started)
        throw new Error(`unexpected ${url}`)
      })
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })

      await client.submitTask<{ value: string; blobKey?: string }>({
        type: 'encode',
        payload: { value: 'a' },
        handlerVersion: 1,
        uploads: { input: { body: 'filedata' } },
        resolvePayload: ({ payload, uploadedKeys }) => ({ ...payload, blobKey: uploadedKeys.input }),
      })

      expect(uploads).toEqual(['filedata'])
      const startInit = fetchImpl.mock.calls.find((c) => c[0] === `${ROOT}/u1/start`)?.[1]
      expect(JSON.parse(startInit?.body as string)).toEqual({
        payload: { value: 'a', blobKey: 'tasks/u1/uploads/input' },
      })
    })
  })

  describe('error handling', () => {
    it('throws TaskRunnerClientError carrying the server code', async () => {
      const fetchImpl = vi
        .fn<FetchLike>()
        .mockResolvedValue(jsonResponse({ code: 'invalid-state', message: 'Task not draft' }, 409))
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })
      await expect(client.startTask('x')).rejects.toMatchObject({ code: 'invalid-state', status: 409 })
    })

    it('falls back to status-derived defaults on a non-JSON error body', async () => {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue({
        ok: false,
        status: 500,
        json: async (): Promise<unknown> => {
          throw new Error('not json')
        },
      } as Response)
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })
      await expect(client.startTask('x')).rejects.toBeInstanceOf(TaskRunnerClientError)
    })
  })

  describe('getTask / getTaskTree / cancelTask', () => {
    it('returns undefined for a 404 task', async () => {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(okResponse(404))
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })
      expect(await client.getTask('missing')).toBeUndefined()
    })

    it('returns the task on a 200', async () => {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(jsonResponse(makeTask({ id: 'g1' })))
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })
      expect((await client.getTask('g1'))?.id).toBe('g1')
    })

    it('fetches the task tree', async () => {
      const node = { task: makeTask({ id: 'r' }), children: [] }
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(jsonResponse(node))
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })
      expect((await client.getTaskTree('r')).task.id).toBe('r')
      expect(fetchImpl.mock.calls[0][0]).toBe(`${ROOT}/r/tree`)
    })

    it('cancels with a reason query and DELETE', async () => {
      const fetchImpl = vi.fn<FetchLike>().mockResolvedValue(okResponse(204))
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl })
      await client.cancelTask('c1', 'manual stop')
      expect(fetchImpl.mock.calls[0][0]).toBe(`${ROOT}/c1?reason=manual%20stop`)
      expect(fetchImpl.mock.calls[0][1]?.method).toBe('DELETE')
    })
  })

  describe('subscribeProgress', () => {
    it('throws when wsUrl is not configured', () => {
      using client = new TaskRunnerClient({ rootUrl: ROOT, fetchImpl: vi.fn<FetchLike>() })
      expect(() => client.subscribeProgress('t1')).toThrow(TaskRunnerClientError)
    })

    it('transitions connecting → subscribed and folds progress + status updates', () => {
      const sockets: MockWebSocket[] = []
      using client = new TaskRunnerClient({
        rootUrl: ROOT,
        wsUrl: 'ws://test',
        fetchImpl: vi.fn<FetchLike>(),
        createWebSocket: () => {
          const ws = createMockWebSocket()
          sockets.push(ws)
          return ws as unknown as WebSocket
        },
      })

      using live = client.subscribeProgress('t1')
      expect(live.state.getValue().status).toBe('connecting')

      const ws = sockets[0]
      ws.simulateOpen()
      const sub = ws.sent.find((m) => m.type === 'subscribe-task')
      expect(sub).toMatchObject({ type: 'subscribe-task', taskId: 't1' })
      const { requestId } = sub as { requestId: string }

      ws.simulateMessage({ type: 'subscribed-task', requestId, subscriptionId: 'sub-1', task: makeTask({ id: 't1' }) })
      let state = live.state.getValue()
      expect(state.status).toBe('subscribed')

      ws.simulateMessage({
        type: 'task-update',
        subscriptionId: 'sub-1',
        kind: 'progress',
        taskId: 't1',
        percent: 42,
        at: 'now',
      })
      state = live.state.getValue()
      expect(state.status === 'subscribed' && state.task.progress?.percent).toBe(42)

      ws.simulateMessage({
        type: 'task-update',
        subscriptionId: 'sub-1',
        kind: 'status',
        taskId: 't1',
        status: 'succeeded',
        at: 'now',
      })
      state = live.state.getValue()
      expect(state.status === 'subscribed' && state.task.status).toBe('succeeded')
    })

    it('reports a subscription error', () => {
      const sockets: MockWebSocket[] = []
      using client = new TaskRunnerClient({
        rootUrl: ROOT,
        wsUrl: 'ws://test',
        fetchImpl: vi.fn<FetchLike>(),
        createWebSocket: () => {
          const ws = createMockWebSocket()
          sockets.push(ws)
          return ws as unknown as WebSocket
        },
      })
      using live = client.subscribeProgress('missing')
      const ws = sockets[0]
      ws.simulateOpen()
      const { requestId } = ws.sent.find((m) => m.type === 'subscribe-task') as { requestId: string }
      ws.simulateMessage({ type: 'subscription-error', requestId, error: 'Task missing not found' })
      const state = live.state.getValue()
      expect(state.status === 'error' && state.error).toBe('Task missing not found')
    })

    it('resubscribes active subscriptions after a reconnect', async () => {
      const sockets: MockWebSocket[] = []
      using client = new TaskRunnerClient({
        rootUrl: ROOT,
        wsUrl: 'ws://test',
        fetchImpl: vi.fn<FetchLike>(),
        reconnectBaseMs: 1,
        createWebSocket: () => {
          const ws = createMockWebSocket()
          sockets.push(ws)
          return ws as unknown as WebSocket
        },
      })
      using live = client.subscribeProgress('t1')
      void live
      sockets[0].simulateOpen()
      sockets[0].simulateClose()

      await new Promise((r) => setTimeout(r, 20))
      expect(sockets.length).toBe(2)
      sockets[1].simulateOpen()
      expect(sockets[1].sent.some((m) => m.type === 'subscribe-task' && m.taskId === 't1')).toBe(true)
    })

    it('sends unsubscribe-task on dispose', () => {
      const sockets: MockWebSocket[] = []
      using client = new TaskRunnerClient({
        rootUrl: ROOT,
        wsUrl: 'ws://test',
        fetchImpl: vi.fn<FetchLike>(),
        createWebSocket: () => {
          const ws = createMockWebSocket()
          sockets.push(ws)
          return ws as unknown as WebSocket
        },
      })
      const live = client.subscribeProgress('t1')
      const ws = sockets[0]
      ws.simulateOpen()
      const { requestId } = ws.sent.find((m) => m.type === 'subscribe-task') as { requestId: string }
      ws.simulateMessage({ type: 'subscribed-task', requestId, subscriptionId: 'sub-1', task: makeTask({ id: 't1' }) })
      // Manual dispose is the behavior under test (it must emit unsubscribe-task).
      live[Symbol.dispose]()
      expect(ws.sent.some((m) => m.type === 'unsubscribe-task' && m.subscriptionId === 'sub-1')).toBe(true)
    })
  })

  describe('defineTaskRunnerClient', () => {
    it('mints a singleton token resolving a shared client', async () => {
      const AppTasks = defineTaskRunnerClient({ rootUrl: ROOT })
      await usingAsync(createInjector(), async (injector) => {
        const a = injector.get(AppTasks)
        const b = injector.get(AppTasks)
        expect(a).toBe(b)
        expect(a).toBeInstanceOf(TaskRunnerClient)
      })
    })
  })
})
