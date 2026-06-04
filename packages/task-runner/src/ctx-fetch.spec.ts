import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { CrossNodeBus, defineInProcessCrossNodeBus } from '@furystack/cross-node-bus'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { defineTaskHandler } from './define-task-handler.js'
import { defineInProcessTaskRunner } from './in-process-task-runner.js'
import { TaskRunner } from './task-runner.js'
import { runTaskToCompletion } from './testing/run-task-to-completion.js'

describe('ctx.fetch (F6)', () => {
  it('records the response on first run and replays it on resume without a second network call', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response('hello', { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)
    try {
      await usingAsync(createInjector(), async (injector) => {
        injector.bind(BlobStore, ({ onDispose }) => {
          const store = new InMemoryBlobStore({ name: 'fetch-blobs' })
          // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
          onDispose(() => store[Symbol.dispose]())
          return store
        })
        injector.bind(CrossNodeBus, defineInProcessCrossNodeBus())
        injector.bind(TaskRunner, defineInProcessTaskRunner({ reconcilerIntervalMs: 200 }))
        const runner = injector.get(TaskRunner)

        const child = defineTaskHandler<Record<string, never>, { done: true }>({
          type: 'fetch-child',
          version: 1,
          handler: async () => ({ done: true }),
        })
        // The handler fetches, then spawns + awaits a child — the await
        // suspends and re-runs the handler from the top on resume, so the
        // `ctx.fetch` step must replay from the log rather than re-fetch.
        const parent = defineTaskHandler<Record<string, never>, { body: string }>({
          type: 'fetch-parent',
          version: 1,
          handler: async (ctx) => {
            const response = await ctx.fetch('https://example.com/data')
            const body = await response.text()
            await ctx.spawnChildAndAwait('fetch-child', {})
            return { body }
          },
        })

        const worker = runner.registerWorker({
          name: 'fetch-worker',
          handlers: [parent, child],
          concurrency: 2,
          tags: [],
          compatibleVersions: {},
        })
        try {
          const task = await runner.submit({ type: 'fetch-parent', payload: {}, handlerVersion: 1 })
          const final = await runTaskToCompletion({ runner, taskId: task.id, timeoutMs: 5000 })
          expect(final.status).toBe('succeeded')
          expect(final.result).toEqual({ body: 'hello' })
          expect(fetchMock).toHaveBeenCalledTimes(1)
        } finally {
          worker[Symbol.dispose]()
        }
      })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
