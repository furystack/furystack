import { using, usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { StoreManager } from './store-manager.js'
import { InMemoryStore } from './in-memory-store.js'
import { AggregatedError } from './errors/aggregated-error.js'
import { TestClass } from './create-physical-store-tests.js'
import { describe, expect, it } from 'vitest'

class Test {
  id!: number
  value!: string
}

describe('StoreManager', () => {
  it('Can be retrieved from an injector', () => {
    using(new Injector(), (i) => {
      expect(i.getInstance(StoreManager)).toBeInstanceOf(StoreManager)
    })
  })

  it('Should throw if trying to retrieve a non-existing store', () => {
    using(new Injector(), (i) => {
      const sm = i.getInstance(StoreManager)
      expect(() =>
        sm.getStoreFor(
          class {
            t!: number
          },
          't',
        ),
      ).toThrow()
    })
  })

  it('Should throw if trying to retrieve an existing store with a different primary key', () => {
    using(new Injector(), (i) => {
      const sm = i.getInstance(StoreManager)
      sm.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' }))
      expect(() => sm.getStoreFor(TestClass, 'booleanValue')).toThrowError('Primary keys not match')
    })
  })

  it('Can set up stores with an extension method', () => {
    using(new Injector(), (i) => {
      i.getInstance(StoreManager).addStore(
        new InMemoryStore({
          model: Test,
          primaryKey: 'id',
        }),
      )

      expect(i.getInstance(StoreManager).getStoreFor(Test, 'id')).toBeInstanceOf(InMemoryStore)
    })
  })

  it('Dispose should throw if failed to dispose one or more store', async () => {
    await usingAsync(new Injector(), async (i) => {
      const sm = i.getInstance(StoreManager)
      const MockStore = class extends InMemoryStore<any, any> {
        public dispose = () => Promise.reject(':(')
      }

      sm.addStore(
        new MockStore({
          model: Test,
          primaryKey: 'id',
        }),
      )
      try {
        await sm.dispose()
      } catch (error) {
        expect(error).toBeInstanceOf(AggregatedError)
        expect((error as AggregatedError).rejections).toHaveLength(1)
      }
      i.cachedSingletons.clear()
    })
  })
})
