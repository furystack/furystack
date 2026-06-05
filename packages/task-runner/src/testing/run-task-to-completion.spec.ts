import { describe, expect, it } from 'vitest'
import { usingAsync } from '@furystack/utils'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { createInjector } from '@furystack/inject'
import { defineInProcessTaskRunner } from '../in-process-task-runner.js'
import { defineTaskHandler } from '../define-task-handler.js'
import { TaskRunner } from '../task-runner.js'
import { runTaskToCompletion } from './run-task-to-completion.js'

describe('runTaskToCompletion', () => {
  const slow = defineTaskHandler<Record<string, never>, void>({
    type: 'slow',
    version: 1,
    handler: async (ctx) => {
      await ctx.sleep(60_000)
    },
  })

  const echo = defineTaskHandler<{ value: string }, { echoed: string }>({
    type: 'echo',
    version: 1,
    handler: async (_ctx, payload) => ({ echoed: payload.value }),
  })

  it('returns the task once it reaches a terminal status', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(BlobStore, ({ onDispose }) => {
        const store = new InMemoryBlobStore({ name: 'rttc' })
        // eslint-disable-next-line furystack/prefer-using-wrapper -- factory paired with onDispose
        onDispose(() => store[Symbol.dispose]())
        return store
      })
      injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 50 }))

      const runner = injector.get(TaskRunner)
      using _worker = runner.registerWorker({
        name: 'rttc/echo',
        handlers: [echo],
        concurrency: 1,
        tags: [],
        compatibleVersions: { echo: [1] },
      })

      const task = await runner.submit({ type: 'echo', payload: { value: 'hi' }, handlerVersion: 1 })
      const completed = await runTaskToCompletion({ runner, taskId: task.id, pollIntervalMs: 10 })
      expect(completed.status).toBe('succeeded')
      expect(completed.result).toEqual({ echoed: 'hi' })
    })
  })

  it('throws with a descriptive message when the task does not finish before timeoutMs', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(BlobStore, ({ onDispose }) => {
        const store = new InMemoryBlobStore({ name: 'rttc-timeout' })
        // eslint-disable-next-line furystack/prefer-using-wrapper -- factory paired with onDispose
        onDispose(() => store[Symbol.dispose]())
        return store
      })
      injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 50 }))

      const runner = injector.get(TaskRunner)
      using _worker = runner.registerWorker({
        name: 'rttc/slow',
        handlers: [slow],
        concurrency: 1,
        tags: [],
        compatibleVersions: { slow: [1] },
      })

      const task = await runner.submit({ type: 'slow', payload: {}, handlerVersion: 1 })

      await expect(
        runTaskToCompletion({ runner, taskId: task.id, timeoutMs: 100, pollIntervalMs: 10 }),
      ).rejects.toThrow(/did not reach terminal status within 100ms/)
    })
  })

  it('reports the current status in the timeout error message', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(BlobStore, ({ onDispose }) => {
        const store = new InMemoryBlobStore({ name: 'rttc-status' })
        // eslint-disable-next-line furystack/prefer-using-wrapper -- factory paired with onDispose
        onDispose(() => store[Symbol.dispose]())
        return store
      })
      injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 50 }))

      const runner = injector.get(TaskRunner)
      using _worker = runner.registerWorker({
        name: 'rttc/slow',
        handlers: [slow],
        concurrency: 1,
        tags: [],
        compatibleVersions: { slow: [1] },
      })

      const task = await runner.submit({ type: 'slow', payload: {}, handlerVersion: 1 })

      try {
        await runTaskToCompletion({ runner, taskId: task.id, timeoutMs: 100, pollIntervalMs: 10 })
        throw new Error('should have thrown')
      } catch (err) {
        const { message } = err as Error
        expect(message).toContain(`Task ${task.id}`)
        expect(message).toMatch(/Current status: (pending|claimed|running)/)
      }
    })
  })

  it('reports "not found" when the task disappears before reaching terminal status', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(BlobStore, ({ onDispose }) => {
        const store = new InMemoryBlobStore({ name: 'rttc-missing' })
        // eslint-disable-next-line furystack/prefer-using-wrapper -- factory paired with onDispose
        onDispose(() => store[Symbol.dispose]())
        return store
      })
      injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 50 }))

      const runner = injector.get(TaskRunner)
      await expect(
        runTaskToCompletion({ runner, taskId: 'missing-id', timeoutMs: 50, pollIntervalMs: 10 }),
      ).rejects.toThrow(/Current status: not found/)
    })
  })
})
