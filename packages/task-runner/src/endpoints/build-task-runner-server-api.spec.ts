import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { BlobStore, BlobStoreError, InMemoryBlobStore } from '@furystack/blob-store'
import { HttpUserContext } from '@furystack/rest-service'
import type { User } from '@furystack/core'
import { createInjector, type Injector } from '@furystack/inject'
import { CrossNodeBus } from '@furystack/cross-node-bus'
import { defineInProcessTaskRunner } from '../in-process-task-runner.js'
import { defineTaskHandler } from '../define-task-handler.js'
import { TaskRunner } from '../task-runner.js'
import type { Task } from '../types.js'
import { buildTaskRunnerServerApi } from './build-task-runner-server-api.js'

const ECHO_HANDLER = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

const ADMIN_USER: User = { username: 'admin', roles: ['admin'] }
const STD_USER: User = { username: 'alice', roles: [] }

type RequestResponse = {
  status: number
  headers: Record<string, string | undefined>
  body: string
}

const startServer = async (api: ReturnType<typeof buildTaskRunnerServerApi>) => {
  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (api.shouldExec({ req, res })) {
      await api.onRequest({ req, res })
      return
    }
    res.writeHead(404)
    res.end()
  }
  const server = createServer((req, res) => {
    handler(req, res).catch((cause: unknown) => {
      if (!res.headersSent) res.writeHead(500)
      res.end(String(cause))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const { port } = server.address() as AddressInfo
  return {
    port,
    close: () => new Promise<void>((resolve, reject) => server.close((cause) => (cause ? reject(cause) : resolve()))),
  }
}

const send = async (
  port: number,
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<RequestResponse> => {
  const init: RequestInit = { method, redirect: 'manual' }
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  const response = await fetch(`http://127.0.0.1:${port}${path}`, init)
  const text = await response.text()
  const headers: Record<string, string | undefined> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })
  return { status: response.status, headers, body: text }
}

const buildInjector = (currentUser: User | null): Injector => {
  const injector = createInjector()
  injector.bind(BlobStore, ({ onDispose }) => {
    const store = new InMemoryBlobStore({ name: 'task-tests' })
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
      getCurrentUser: async () => {
        if (!currentUser) throw new Error('no user')
        return currentUser
      },
    } as unknown as HttpUserContext
  })
  return injector
}

describe('buildTaskRunnerServerApi', () => {
  let injector: Injector
  let server: { port: number; close: () => Promise<void> } | undefined

  afterEach(async () => {
    if (server) {
      await server.close()
      server = undefined
    }
    if (injector) {
      await injector[Symbol.asyncDispose]()
    }
  })

  describe('shouldExec', () => {
    it('matches paths under rootPath', () => {
      injector = buildInjector(ADMIN_USER)
      const api = buildTaskRunnerServerApi({ injector, rootPath: '/tasks' })
      expect(api.shouldExec({ req: { url: '/tasks' } as IncomingMessage } as never)).toBe(true)
      expect(api.shouldExec({ req: { url: '/tasks/abc' } as IncomingMessage } as never)).toBe(true)
      expect(api.shouldExec({ req: { url: '/other' } as IncomingMessage } as never)).toBe(false)
      expect(api.shouldExec({ req: { url: '/tasksfoo' } as IncomingMessage } as never)).toBe(false)
    })
  })

  describe('POST {root} (draft)', () => {
    it('creates a draft task in `draft` status', async () => {
      injector = buildInjector(ADMIN_USER)
      injector.get(TaskRunner).registerWorker({
        name: 'echo-worker',
        handlers: [ECHO_HANDLER],
        concurrency: 1,
        tags: [],
        compatibleVersions: {},
      })
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const res = await send(server.port, 'POST', '/tasks', {
        type: 'echo',
        payload: { value: 'placeholder' },
        handlerVersion: 1,
      })

      expect(res.status).toBe(201)
      const parsed = JSON.parse(res.body) as { task: Task; uploads: Record<string, unknown> }
      expect(parsed.task.status).toBe('draft')
      expect(parsed.task.submittedBy).toBe('admin')
      expect(parsed.uploads).toEqual({})
    })

    it('returns 401 when authentication fails', async () => {
      injector = buildInjector(null)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const res = await send(server.port, 'POST', '/tasks', {
        type: 'echo',
        payload: {},
        handlerVersion: 1,
      })
      expect(res.status).toBe(401)
    })

    it('returns 403 when role check fails', async () => {
      injector = buildInjector(STD_USER)
      server = await startServer(
        buildTaskRunnerServerApi({
          injector,
          rootPath: '/tasks',
          authorizers: { echo: { submit: ['admin'] } },
        }),
      )

      const res = await send(server.port, 'POST', '/tasks', {
        type: 'echo',
        payload: {},
        handlerVersion: 1,
      })
      expect(res.status).toBe(403)
    })

    it('rejects body without type or handlerVersion', async () => {
      injector = buildInjector(ADMIN_USER)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const noType = await send(server.port, 'POST', '/tasks', { payload: {}, handlerVersion: 1 })
      expect(noType.status).toBe(400)

      const noVersion = await send(server.port, 'POST', '/tasks', { type: 'echo', payload: {} })
      expect(noVersion.status).toBe(400)
    })

    it('returns 501 when uploads are requested but BlobStore lacks presigned URLs', async () => {
      injector = buildInjector(ADMIN_USER)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const res = await send(server.port, 'POST', '/tasks', {
        type: 'echo',
        payload: {},
        handlerVersion: 1,
        uploads: { input: { contentType: 'application/octet-stream' } },
      })
      expect(res.status).toBe(501)
      const errBody = JSON.parse(res.body) as { code: string }
      expect(errBody.code).toBe('capability-missing')
    })

    it('returns presigned upload URLs for declared slots when BlobStore supports them', async () => {
      injector = buildInjector(ADMIN_USER)
      // Replace the blob store binding with a fake that supports getUploadUrl.
      injector.bind(BlobStore, () => {
        const store = new InMemoryBlobStore({ name: 'fake-presigned' }) as unknown as InMemoryBlobStore & {
          getUploadUrl: (
            key: string,
            opts: { ttlSec: number; contentType?: string; maxBytes?: number },
          ) => Promise<{ url: string; method: 'PUT' | 'POST' }>
        }
        store.getUploadUrl = async (key) => ({ url: `https://test/upload/${key}`, method: 'PUT' })
        return store
      })
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const res = await send(server.port, 'POST', '/tasks', {
        type: 'echo',
        payload: { value: 'placeholder' },
        handlerVersion: 1,
        uploads: { input: { contentType: 'application/octet-stream', maxBytes: 1024 } },
      })

      expect(res.status).toBe(201)
      const parsed = JSON.parse(res.body) as {
        task: Task
        uploads: Record<string, { key: string; url: string; method: string }>
      }
      expect(parsed.uploads.input).toBeDefined()
      expect(parsed.uploads.input.url).toBe(`https://test/upload/tasks/${parsed.task.id}/uploads/input`)
      expect(parsed.uploads.input.method).toBe('PUT')
    })

    it('rejects upload slot names with invalid characters', async () => {
      injector = buildInjector(ADMIN_USER)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const res = await send(server.port, 'POST', '/tasks', {
        type: 'echo',
        payload: {},
        handlerVersion: 1,
        uploads: { 'bad/name': { contentType: 'x' } },
      })
      expect(res.status).toBe(400)
    })
  })

  describe('POST {root}/:id/start', () => {
    it('flips a draft to pending and returns the updated task', async () => {
      injector = buildInjector(ADMIN_USER)
      injector.get(TaskRunner).registerWorker({
        name: 'echo-worker',
        handlers: [ECHO_HANDLER],
        concurrency: 1,
        tags: [],
        compatibleVersions: {},
      })
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const create = await send(server.port, 'POST', '/tasks', {
        type: 'echo',
        payload: { value: 'first' },
        handlerVersion: 1,
      })
      const taskId = (JSON.parse(create.body) as { task: Task }).task.id

      const start = await send(server.port, 'POST', `/tasks/${taskId}/start`, { payload: { value: 'final' } })
      expect(start.status).toBe(200)
      const startedTask = JSON.parse(start.body) as Task
      expect(startedTask.status).toBe('pending')
      expect(startedTask.payload).toEqual({ value: 'final' })
    })

    it('returns 404 for unknown task', async () => {
      injector = buildInjector(ADMIN_USER)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const res = await send(server.port, 'POST', '/tasks/missing/start', {})
      expect(res.status).toBe(404)
    })

    it('returns 409 when starting a non-draft task', async () => {
      injector = buildInjector(ADMIN_USER)
      injector.get(TaskRunner).registerWorker({
        name: 'echo-worker',
        handlers: [ECHO_HANDLER],
        concurrency: 1,
        tags: [],
        compatibleVersions: {},
      })
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const submitted = await injector.get(TaskRunner).submit({
        type: 'echo',
        payload: { value: 'x' },
        handlerVersion: 1,
      })
      const res = await send(server.port, 'POST', `/tasks/${submitted.id}/start`, {})
      expect(res.status).toBe(409)
    })
  })

  describe('GET {root}/:id', () => {
    it('returns the task', async () => {
      injector = buildInjector(ADMIN_USER)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const draft = await injector.get(TaskRunner).draft({
        type: 'echo',
        payload: { value: 'x' },
        handlerVersion: 1,
      })
      const res = await send(server.port, 'GET', `/tasks/${draft.id}`)
      expect(res.status).toBe(200)
      const fetched = JSON.parse(res.body) as Task
      expect(fetched.id).toBe(draft.id)
    })

    it('returns 404 for unknown id', async () => {
      injector = buildInjector(ADMIN_USER)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))
      const res = await send(server.port, 'GET', '/tasks/none')
      expect(res.status).toBe(404)
    })
  })

  describe('GET {root}/:id/tree', () => {
    it('returns the task tree', async () => {
      injector = buildInjector(ADMIN_USER)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const draft = await injector.get(TaskRunner).draft({
        type: 'echo',
        payload: { value: 'x' },
        handlerVersion: 1,
      })
      const res = await send(server.port, 'GET', `/tasks/${draft.id}/tree`)
      expect(res.status).toBe(200)
      const tree = JSON.parse(res.body) as { task: Task; children: unknown[] }
      expect(tree.task.id).toBe(draft.id)
      expect(tree.children).toEqual([])
    })
  })

  describe('DELETE {root}/:id', () => {
    it('cancels the task and forwards reason', async () => {
      injector = buildInjector(ADMIN_USER)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const draft = await injector.get(TaskRunner).draft({
        type: 'echo',
        payload: { value: 'x' },
        handlerVersion: 1,
      })
      const res = await send(server.port, 'DELETE', `/tasks/${draft.id}?reason=byebye`)
      expect(res.status).toBe(204)

      const task = await injector.get(TaskRunner).get(draft.id)
      expect(task?.status).toBe('cancelled')
      const evt = task?.events.find((e) => e.kind === 'cancellation-requested')
      expect(evt && 'reason' in evt ? evt.reason : undefined).toBe('byebye')
    })
  })

  describe('GET {root}/:id/download', () => {
    it('redirects to the first produced blob', async () => {
      injector = buildInjector(ADMIN_USER)
      const blobStore = injector.get(BlobStore)
      const downloads: string[] = []
      const fakeBs = blobStore as unknown as { getDownloadUrl: BlobStore['getDownloadUrl'] }
      fakeBs.getDownloadUrl = async (key) => {
        downloads.push(key)
        return `https://test/dl/${key}`
      }
      const runner = injector.get(TaskRunner)
      const draft = await runner.draft({ type: 'echo', payload: {}, handlerVersion: 1 })
      // Simulate a finished task with one produced blob.
      draft.producedBlobs = [{ storeName: 'in-memory', key: 'output/file.bin' }]
      // Persist via dataset:
      const { TaskDataSet } = await import('../task-data-set.js')
      await injector.get(TaskDataSet).update(injector, draft.id, {
        producedBlobs: [{ storeName: 'in-memory', key: 'output/file.bin' }],
      })
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const res = await send(server.port, 'GET', `/tasks/${draft.id}/download`)
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('https://test/dl/output/file.bin')
      expect(downloads).toEqual(['output/file.bin'])
    })

    it('returns 404 when the task has no produced blobs', async () => {
      injector = buildInjector(ADMIN_USER)
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))
      const draft = await injector.get(TaskRunner).draft({
        type: 'echo',
        payload: {},
        handlerVersion: 1,
      })
      const res = await send(server.port, 'GET', `/tasks/${draft.id}/download`)
      expect(res.status).toBe(404)
    })
  })

  describe('GET {root}/:id/blobs/:key', () => {
    it('redirects when the explicit key is in producedBlobs', async () => {
      injector = buildInjector(ADMIN_USER)
      const blobStore = injector.get(BlobStore)
      ;(blobStore as unknown as { getDownloadUrl: BlobStore['getDownloadUrl'] }).getDownloadUrl = async (key) =>
        `https://test/dl/${key}`
      const runner = injector.get(TaskRunner)
      const draft = await runner.draft({ type: 'echo', payload: {}, handlerVersion: 1 })
      const { TaskDataSet } = await import('../task-data-set.js')
      await injector.get(TaskDataSet).update(injector, draft.id, {
        producedBlobs: [
          { storeName: 'in-memory', key: 'a/foo.bin' },
          { storeName: 'in-memory', key: 'b/bar.bin' },
        ],
      })
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))

      const res = await send(server.port, 'GET', `/tasks/${draft.id}/blobs/${encodeURIComponent('b/bar.bin')}`)
      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('https://test/dl/b/bar.bin')
    })

    it('rejects blob keys not on the producedBlobs allowlist', async () => {
      injector = buildInjector(ADMIN_USER)
      const runner = injector.get(TaskRunner)
      const draft = await runner.draft({ type: 'echo', payload: {}, handlerVersion: 1 })
      const { TaskDataSet } = await import('../task-data-set.js')
      await injector.get(TaskDataSet).update(injector, draft.id, {
        producedBlobs: [{ storeName: 'in-memory', key: 'a/foo.bin' }],
      })
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))
      const res = await send(server.port, 'GET', `/tasks/${draft.id}/blobs/${encodeURIComponent('z/forbidden.bin')}`)
      expect(res.status).toBe(404)
    })
  })

  describe('CrossNodeBus binding', () => {
    it('the runner factory resolves a default in-process bus without explicit binding', () => {
      injector = buildInjector(ADMIN_USER)
      // Sanity: the InProcessTaskRunner factory must have resolved the bus.
      expect(injector.get(CrossNodeBus)).toBeDefined()
    })
  })

  describe('error propagation', () => {
    it('translates BlobStoreError(not-found) to 404 on download', async () => {
      injector = buildInjector(ADMIN_USER)
      const blobStore = injector.get(BlobStore)
      ;(blobStore as unknown as { getDownloadUrl: BlobStore['getDownloadUrl'] }).getDownloadUrl = async () => {
        throw new BlobStoreError('not-found', 'Blob not found')
      }
      const runner = injector.get(TaskRunner)
      const draft = await runner.draft({ type: 'echo', payload: {}, handlerVersion: 1 })
      const { TaskDataSet } = await import('../task-data-set.js')
      await injector.get(TaskDataSet).update(injector, draft.id, {
        producedBlobs: [{ storeName: 'in-memory', key: 'a/foo.bin' }],
      })
      server = await startServer(buildTaskRunnerServerApi({ injector, rootPath: '/tasks' }))
      const res = await send(server.port, 'GET', `/tasks/${draft.id}/download`)
      expect(res.status).toBe(404)
    })
  })
})
