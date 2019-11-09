import { using } from '@sensenet/client-utils'
import '@furystack/logging'
import { Injector } from '@furystack/inject'
import { StoreManager, InMemoryStore } from '../src'

describe('StoreManager', () => {
  it('Can be retrieved from an injector', () => {
    using(new Injector(), i => {
      expect(i.useLogging().getInstance(StoreManager)).toBeInstanceOf(StoreManager)
    })
  })

  it('Should throw if trying to retrieve a non-existing store', () => {
    using(new Injector(), i => {
      const sm = i.useLogging().getInstance(StoreManager)
      expect(() => sm.getStoreFor(class {})).toThrow()
    })
  })

  it('Can set up stores with an extension method', () => {
    class Test {
      id!: number
      value!: string
    }

    using(new Injector(), i => {
      i.useLogging().setupStores(stores =>
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
