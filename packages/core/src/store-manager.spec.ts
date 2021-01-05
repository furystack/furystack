import { using } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { StoreManager } from './store-manager'
import { InMemoryStore } from './in-memory-store'
import './injector-extensions'

describe('StoreManager', () => {
  it('Can be retrieved from an injector', () => {
    using(new Injector(), (i) => {
      expect(i.getInstance(StoreManager)).toBeInstanceOf(StoreManager)
    })
  })

  it('Should throw if trying to retrieve a non-existing store', () => {
    using(new Injector(), (i) => {
      const sm = i.getInstance(StoreManager)
      expect(() => sm.getStoreFor(class {})).toThrow()
    })
  })

  it('Can set up stores with an extension method', () => {
    class Test {
      id!: number
      value!: string
    }

    using(new Injector(), (i) => {
      i.setupStores((stores) =>
        stores.addStore(
          new InMemoryStore({
            model: Test,
            primaryKey: 'id',
          }),
        ),
      )

      expect(i.getInstance(StoreManager).getStoreFor(Test)).toBeInstanceOf(InMemoryStore)
    })
  })
})
