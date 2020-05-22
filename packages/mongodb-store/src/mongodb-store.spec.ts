import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { TestClass, createStoreTest } from '@furystack/core/dist/create-physical-store-tests'
import { v4 } from 'uuid'
import '@furystack/logging'
import './store-manager-extensions'
import { MongoClientFactory } from './mongo-client-factory'

describe('MongoDB Store', () => {
  let dbIdx = 0
  const getMongoOptions = () => ({
    model: TestClass,
    primaryKey: 'id' as const,
    collection: `furystack-mongo-store-tests-${v4()}`,
    db: `furystack-mongo-store-tests-${dbIdx++}`,
    url: 'mongodb://localhost:27017',
    options: { useUnifiedTopology: true },
  })
  createStoreTest({
    typeName: 'mongodb-store',
    createStore: () => {
      const mongoOptions = getMongoOptions()
      const i = new Injector().useLogging().setupStores((sm) => sm.useMongoDb(mongoOptions))
      const store = i.getInstance(StoreManager).getStoreFor<TestClass>(TestClass)
      const oldDispose = store.dispose
      store.dispose = async () => {
        const client = await i.getInstance(MongoClientFactory).getClientFor(mongoOptions.url, mongoOptions.options)
        await client.db(`furystack-mongo-store-tests-${dbIdx}`).dropDatabase()
        store.dispose = oldDispose
        await i.dispose()
      }
      return store
    },
  })
})
