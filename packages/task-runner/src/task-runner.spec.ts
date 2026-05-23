import { describe, expect, it } from 'vitest'
import { usingAsync } from '@furystack/utils'
import { createInjector } from '@furystack/inject'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { TaskRunner } from './task-runner.js'
import { defineInProcessTaskRunner, InProcessTaskRunner } from './in-process-task-runner.js'

describe('TaskRunner', () => {
  it('throws a configuration error when resolved without a bound implementation', async () => {
    await usingAsync(createInjector(), async (injector) => {
      expect(() => injector.get(TaskRunner)).toThrow(/TaskRunner is not configured/)
    })
  })

  it('mentions defineInProcessTaskRunner in the not-configured error message', async () => {
    await usingAsync(createInjector(), async (injector) => {
      expect(() => injector.get(TaskRunner)).toThrow(/defineInProcessTaskRunner/)
    })
  })

  it('resolves to the bound implementation once configured', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(BlobStore, ({ onDispose }) => {
        const store = new InMemoryBlobStore({ name: 'tr-blob' })
        // eslint-disable-next-line furystack/prefer-using-wrapper -- factory paired with onDispose
        onDispose(() => store[Symbol.dispose]())
        return store
      })
      injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 100 }))

      const runner = injector.get(TaskRunner)
      expect(runner).toBeInstanceOf(InProcessTaskRunner)
      expect(runner.capabilities).toMatchObject({
        persistent: false,
        fleetCapEnforcement: false,
        delayedDispatch: true,
      })
    })
  })

  it('exposes the same instance on repeated lookups (singleton lifetime)', async () => {
    await usingAsync(createInjector(), async (injector) => {
      injector.bind(BlobStore, ({ onDispose }) => {
        const store = new InMemoryBlobStore({ name: 'tr-singleton' })
        // eslint-disable-next-line furystack/prefer-using-wrapper -- factory paired with onDispose
        onDispose(() => store[Symbol.dispose]())
        return store
      })
      injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 100 }))

      expect(injector.get(TaskRunner)).toBe(injector.get(TaskRunner))
    })
  })
})
