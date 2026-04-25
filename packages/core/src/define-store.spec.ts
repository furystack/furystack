import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { TestClass } from './create-physical-store-tests.js'
import { defineStore } from './define-store.js'
import { InMemoryStore } from './in-memory-store.js'

class Test {
  declare id: number
  declare value: string
}

describe('defineStore', () => {
  it('resolves to the physical store produced by its factory', async () => {
    const TestStore = defineStore({
      name: 'test/TestStore',
      model: Test,
      primaryKey: 'id',
      factory: () => new InMemoryStore({ model: Test, primaryKey: 'id' }),
    })
    await usingAsync(createInjector(), async (i) => {
      expect(i.get(TestStore)).toBeInstanceOf(InMemoryStore)
    })
  })

  it('caches the store as a singleton across resolutions', async () => {
    const TestStore = defineStore({
      name: 'test/SingletonStore',
      model: Test,
      primaryKey: 'id',
      factory: () => new InMemoryStore({ model: Test, primaryKey: 'id' }),
    })
    await usingAsync(createInjector(), async (i) => {
      expect(i.get(TestStore)).toBe(i.get(TestStore))
    })
  })

  it('exposes the model and primary key on the token for metadata-driven consumers', () => {
    const TestStore = defineStore({
      name: 'test/MetaStore',
      model: TestClass,
      primaryKey: 'id',
      factory: () => new InMemoryStore({ model: TestClass, primaryKey: 'id' }),
    })
    expect(TestStore.model).toBe(TestClass)
    expect(TestStore.primaryKey).toBe('id')
  })

  it('invokes the factory only once even when resolved from multiple scopes', async () => {
    const factory = vi.fn(() => new InMemoryStore({ model: Test, primaryKey: 'id' }))
    const TestStore = defineStore({
      name: 'test/OnceStore',
      model: Test,
      primaryKey: 'id',
      factory,
    })
    await usingAsync(createInjector(), async (i) => {
      await usingAsync(i.createScope(), async (child) => {
        i.get(TestStore)
        child.get(TestStore)
      })
    })
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('disposes a sync-disposable store when the injector is disposed', async () => {
    const disposeSpy = vi.fn()
    class SyncStore extends InMemoryStore<Test, 'id'> {
      public override [Symbol.dispose] = () => {
        disposeSpy()
        super[Symbol.dispose]()
      }
    }
    const TestStore = defineStore({
      name: 'test/SyncDisposeStore',
      model: Test,
      primaryKey: 'id',
      factory: () => new SyncStore({ model: Test, primaryKey: 'id' }),
    })
    const i = createInjector()
    i.get(TestStore)
    await i[Symbol.asyncDispose]()
    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })

  it('disposes an async-disposable store when the injector is disposed', async () => {
    const disposeSpy = vi.fn(() => Promise.resolve())
    class AsyncStore extends InMemoryStore<Test, 'id'> {
      public [Symbol.asyncDispose] = disposeSpy
    }
    const TestStore = defineStore({
      name: 'test/AsyncDisposeStore',
      model: Test,
      primaryKey: 'id',
      factory: () => new AsyncStore({ model: Test, primaryKey: 'id' }),
    })
    const i = createInjector()
    i.get(TestStore)
    await i[Symbol.asyncDispose]()
    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })

  it('aggregates errors from multiple failing store disposals', async () => {
    class FailingAsyncStore extends InMemoryStore<Test, 'id'> {
      public [Symbol.asyncDispose] = () => Promise.reject(new Error('async-fail'))
    }
    class FailingSyncStore extends InMemoryStore<Test, 'id'> {
      public override [Symbol.dispose] = () => {
        throw new Error('sync-fail')
      }
    }
    const AsyncFail = defineStore({
      name: 'test/AsyncFailStore',
      model: Test,
      primaryKey: 'id',
      factory: () => new FailingAsyncStore({ model: Test, primaryKey: 'id' }),
    })
    const SyncFail = defineStore({
      name: 'test/SyncFailStore',
      model: Test,
      primaryKey: 'id',
      factory: () => new FailingSyncStore({ model: Test, primaryKey: 'id' }),
    })
    const i = createInjector()
    i.get(AsyncFail)
    i.get(SyncFail)
    const aggregate = await i[Symbol.asyncDispose]().then(
      () => undefined,
      (error: unknown) => error,
    )
    expect(aggregate).toBeInstanceOf(AggregateError)
    const messages = (aggregate as AggregateError).errors.map((e) => (e as Error).message)
    expect(messages).toContain('async-fail')
    expect(messages).toContain('sync-fail')
  })
})
