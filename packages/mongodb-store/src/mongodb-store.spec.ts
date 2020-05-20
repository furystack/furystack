import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { TestClass, createStoreTest } from '@furystack/core/dist/create-physical-store-tests'
import { v4 } from 'uuid'
import '@furystack/logging'
import './store-manager-extensions'

class MongoTestClass extends TestClass {
  _id!: string
}

describe('MongoDB Store', () => {
  createStoreTest({
    typeName: 'mongodb-store',
    createStore: () => {
      const i = new Injector().useLogging().setupStores((sm) =>
        sm.useMongoDb({
          model: MongoTestClass,
          collection: `furystack-mongo-store-tests-${v4()}`,
          db: 'furystack-mongo-store-tests',
          url: 'mongodb://localhost:27017',
          options: { useUnifiedTopology: true },
        }),
      )
      const store = i.getInstance(StoreManager).getStoreFor<TestClass>(MongoTestClass)
      return store
    },
  })
})
