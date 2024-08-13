import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { TestClass } from './create-physical-store-tests.js'
import { AggregatedError } from './errors/aggregated-error.js'
import { InMemoryStore } from './in-memory-store.js'
import { StoreManager } from './store-manager.js'

class Test {
  declare id: number
  declare value: string
}

describe('StoreManager', () => {
  it('Can be retrieved from an injector', async () => {
    await usingAsync(new Injector(), async (i) => {
      expect(i.getInstance(StoreManager)).toBeInstanceOf(StoreManager)
    })
  })

  it('Should throw if trying to retrieve a non-existing store', async () => {
    await usingAsync(new Injector(), async (i) => {
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

  it('Should throw if trying to retrieve an existing store with a different primary key', async () => {
    await usingAsync(new Injector(), async (i) => {
      const sm = i.getInstance(StoreManager)
      sm.addStore(new InMemoryStore({ model: TestClass, primaryKey: 'id' }))
      expect(() => sm.getStoreFor(TestClass, 'booleanValue')).toThrowError('Primary keys not match')
    })
  })

  it('Can set up stores with an extension method', async () => {
    await usingAsync(new Injector(), async (i) => {
      i.getInstance(StoreManager).addStore(
        new InMemoryStore({
          model: Test,
          primaryKey: 'id',
        }),
      )

      expect(i.getInstance(StoreManager).getStoreFor(Test, 'id')).toBeInstanceOf(InMemoryStore)
    })
  })

  it('should throw if failed to dispose async one or more store', async () => {
    await usingAsync(new Injector(), async (i) => {
      const sm = i.getInstance(StoreManager)
      const MockStore = class extends InMemoryStore<any, any> {
        public [Symbol.asyncDispose] = () => Promise.reject(new Error(':('))
      }

      sm.addStore(
        new MockStore({
          model: Test,
          primaryKey: 'id',
        }),
      )
      try {
        await sm[Symbol.asyncDispose]()
      } catch (error) {
        expect(error).toBeInstanceOf(AggregatedError)
        expect((error as AggregatedError).rejections).toHaveLength(1)
      }
      i.cachedSingletons.clear()
    })
  })

  it('should throw if failed to dispose one or more store', async () => {
    await usingAsync(new Injector(), async (i) => {
      const sm = i.getInstance(StoreManager)
      const MockStore = class extends InMemoryStore<any, any> {
        public [Symbol.dispose] = () => {
          throw new Error(':(')
        }
      }

      sm.addStore(
        new MockStore({
          model: Test,
          primaryKey: 'id',
        }),
      )
      try {
        await sm[Symbol.asyncDispose]()
      } catch (error) {
        expect(error).toBeInstanceOf(AggregatedError)
        expect((error as AggregatedError).rejections).toHaveLength(1)
      }
      i.cachedSingletons.clear()
    })
  })
})
