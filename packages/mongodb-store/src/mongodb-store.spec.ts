import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { TestClass, createStoreTest } from '@furystack/core/dist/create-physical-store-tests'
import { v4 } from 'uuid'
import './store-manager-extensions'
import { MongoClientFactory } from './mongo-client-factory'
import { usingAsync } from '@furystack/utils'

class TestClassWithId {
  _id!: string
  value!: string
}

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
      const i = new Injector().setupStores((sm) => sm.useMongoDb(mongoOptions))
      const store = i.getInstance(StoreManager).getStoreFor<TestClass>(TestClass)
      const oldDispose = store.dispose
      store.dispose = async () => {
        const client = await i.getInstance(MongoClientFactory).getClientFor(mongoOptions.url, mongoOptions.options)
        const db = client.db(mongoOptions.db)
        await db.dropDatabase()
        store.dispose = oldDispose
        await i.dispose()
      }
      return store
    },
  })

  it('Should retrieve an entity with its id', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setupStores((sm) => sm.useMongoDb({ ...getMongoOptions(), model: TestClassWithId, primaryKey: '_id' }))
      const store = injector.getInstance(StoreManager).getStoreFor(TestClassWithId)
      const { created } = await store.add({ value: 'value1' })

      expect(typeof created[0]._id).toBe('string')

      const retrieved = await store.get(created[0]._id)
      expect(retrieved).toEqual(created[0])
    })
  })

  it('Should retrieve more entities with theis ids', async () => {
    await usingAsync(new Injector(), async (injector) => {
      injector.setupStores((sm) => sm.useMongoDb({ ...getMongoOptions(), model: TestClassWithId, primaryKey: '_id' }))
      const store = injector.getInstance(StoreManager).getStoreFor(TestClassWithId)
      const { created } = await store.add({ value: 'value1' }, { value: 'value2' }, { value: 'value3' })
      const retrieved = await store.find({ filter: { _id: { $in: created.map((c) => c._id) } } })
      expect(retrieved.length).toBe(3)
      expect(retrieved).toEqual(created)
    })
  })
})
