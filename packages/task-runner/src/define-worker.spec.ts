import { describe, expect, it } from 'vitest'
import { usingAsync } from '@furystack/utils'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { createInjector } from '@furystack/inject'
import { defineTaskHandler } from './define-task-handler.js'
import { defineWorker } from './define-worker.js'
import { defineInProcessTaskRunner } from './in-process-task-runner.js'
import { TaskRunner } from './task-runner.js'
import { runTaskToCompletion } from './testing/run-task-to-completion.js'

const echo = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'worker-echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

describe('defineWorker', () => {
  it('registers handlers with the bound TaskRunner and runs submitted tasks', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(BlobStore, ({ onDispose }) => {
        const store = new InMemoryBlobStore({ name: 'worker-blobs' })
        // eslint-disable-next-line furystack/prefer-using-wrapper -- factory paired with onDispose
        onDispose(() => store[Symbol.dispose]())
        return store
      })
      injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 100 }))

      const EchoWorker = defineWorker({
        name: 'test/EchoWorker',
        types: [echo],
        concurrency: 1,
      })

      const worker = injector.get(EchoWorker)
      expect(worker.name).toBe('test/EchoWorker')
      expect(worker.workerId).toMatch(/^worker-/)

      const runner = injector.get(TaskRunner)
      const submitted = await runner.submit({ type: 'worker-echo', payload: { value: 'wired' }, handlerVersion: 1 })
      const completed = await runTaskToCompletion({ runner, taskId: submitted.id })
      expect(completed.status).toBe('succeeded')
      expect(completed.result).toEqual({ echoed: 'wired' })
    })
  })

  it('disposes the worker when the injector tears down', async () => {
    const injector = createInjector()
    injector.bind(BlobStore, ({ onDispose }) => {
      const store = new InMemoryBlobStore({ name: 'worker-blobs-dispose' })
      // eslint-disable-next-line furystack/prefer-using-wrapper -- factory paired with onDispose
      onDispose(() => store[Symbol.dispose]())
      return store
    })
    injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 100 }))

    const EchoWorker = defineWorker({ name: 'test/EchoDisposable', types: [echo] })
    const worker = injector.get(EchoWorker)
    expect(worker.activeTaskCount).toBe(0)

    await injector[Symbol.asyncDispose]()
    // After disposal the worker is unregistered; no API surface to assert directly,
    // but injector disposal must not throw — that is the assertion.
  })
})
