import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import '@furystack/logging'
import { v4 } from 'uuid'
import { MongodbStore } from './mongodb-store'
import './store-manager-extensions'

describe('MongoDB Store', () => {
  class ExampleClass {
    _id!: string
    value!: string
  }

  let i!: Injector
  let store!: MongodbStore<ExampleClass>

  beforeEach(async () => {
    i = new Injector().useLogging().setupStores((sm) =>
      sm.useMongoDb({
        model: ExampleClass,
        collection: 'furystack-mongo-store-tests',
        db: 'furystack-mongo-store-tests',
        url: 'mongodb://localhost:27017',
        options: { useUnifiedTopology: true },
      }),
    )
    store = i.getInstance(StoreManager).getStoreFor(ExampleClass)
  })

  afterEach(async () => {
    await store.dispose()
    await i.dispose()
  })

  it('Should be a MongodbStore instance', () => {
    expect(store).toBeInstanceOf(MongodbStore)
  })

  it('Should add an entity', async () => {
    const entityToAdd = { value: v4() } as ExampleClass
    await store.add(entityToAdd)
    const retrieved = await store.get(entityToAdd._id)
    expect(retrieved).toStrictEqual(entityToAdd)
    await store.update(entityToAdd._id, { value: 'updatedValue' })
    const updated = await store.get(entityToAdd._id)
    expect(updated?.value).toBe('updatedValue')
    await store.remove(entityToAdd._id)
    const deleted = await store.get(entityToAdd._id)
    expect(deleted).toBeFalsy()
  })

  it('Count should return a number', async () => {
    const count = await store.count()
    expect(isNaN(count)).toBe(false)
  })

  it('Should throw on search', async () => {
    const entries = await store.find({ top: 1 })
    for (const entry of entries) {
      expect(entry).toBeInstanceOf(Object)
    }
  })
})
