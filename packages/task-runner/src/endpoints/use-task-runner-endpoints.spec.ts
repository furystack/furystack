import { describe, expect, it, vi } from 'vitest'

vi.mock('@furystack/websocket-api', () => ({
  useWebSocketApi: vi.fn(async (opts: { path: string; port: number; actions: unknown[] }) => ({
    kind: 'fake-ws',
    path: opts.path,
    port: opts.port,
    actions: opts.actions,
  })),
}))

import { createInjector } from '@furystack/inject'
import { HttpServerPoolToken, type ServerApi, type ServerRecord } from '@furystack/rest-service'
import { usingAsync } from '@furystack/utils'
import { useWebSocketApi } from '@furystack/websocket-api'
import { useTaskRunnerEndpoints } from './use-task-runner-endpoints.js'

const bindPool = (
  injector: ReturnType<typeof createInjector>,
): { record: ServerRecord; acquire: ReturnType<typeof vi.fn> } => {
  const record = { server: {}, apis: [] as ServerApi[] } as unknown as ServerRecord
  const acquire = vi.fn(async (_options: { port: number; hostName?: string }) => record)
  injector.bind(HttpServerPoolToken, () => ({ acquire }))
  return { record, acquire }
}

describe('useTaskRunnerEndpoints', () => {
  it('acquires the pooled server, mounts the REST API, and wires the WS subscribe action with defaults', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const { record, acquire } = bindPool(injector)
      const wsMock = vi.mocked(useWebSocketApi)
      wsMock.mockClear()

      const result = await useTaskRunnerEndpoints({ injector, port: 4321 })

      expect(acquire).toHaveBeenCalledWith({ port: 4321, hostName: undefined })
      expect(record.apis).toHaveLength(1)
      expect(result.serverApi).toBe(record.apis[0])

      expect(wsMock).toHaveBeenCalledTimes(1)
      const wsArgs = wsMock.mock.calls[0][0]
      expect(wsArgs.path).toBe('/tasks-socket')
      expect(wsArgs.port).toBe(4321)
      expect(wsArgs.actions).toHaveLength(1)
      expect(result.websocket).toBe(await wsMock.mock.results[0].value)
    })
  })

  it('honours custom rootPath and wsPath', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const { record } = bindPool(injector)
      const wsMock = vi.mocked(useWebSocketApi)
      wsMock.mockClear()

      const result = await useTaskRunnerEndpoints({
        injector,
        port: 4321,
        hostName: '127.0.0.1',
        rootPath: '/jobs',
        wsPath: '/jobs-ws',
      })

      // The mounted REST API claims requests under the custom root path.
      const serverApi = record.apis[0]
      expect(serverApi.shouldExec({ req: { url: '/jobs' } } as Parameters<ServerApi['shouldExec']>[0])).toBe(true)
      expect(serverApi.shouldExec({ req: { url: '/jobs/abc' } } as Parameters<ServerApi['shouldExec']>[0])).toBe(true)
      expect(serverApi.shouldExec({ req: { url: '/other' } } as Parameters<ServerApi['shouldExec']>[0])).toBe(false)
      expect(result.serverApi).toBe(serverApi)

      expect(vi.mocked(useWebSocketApi).mock.calls[0][0].path).toBe('/jobs-ws')
    })
  })
})
