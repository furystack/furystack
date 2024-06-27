import { TextDecoder, TextEncoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

import { StoreManager } from '@furystack/core'
import { TestClass, createStoreTest } from '@furystack/core/create-physical-store-tests'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { MongoClientFactory } from './mongo-client-factory.js'
import { useMongoDb } from './store-manager-helpers.js'

class TestClassWithId {
  declare _id: string
  declare value: string
}

let storeCount = 0

const mongoDbUrl = process?.env?.MONGODB_URL || 'mongodb://localhost:27017'

describe('MongoDB Store', () => {
  let dbIdx = 0

  const getMongoOptions = (injector: Injector) => ({
    injector,
    model: TestClass,
    primaryKey: 'id' as const,
    collection: `furystack-mongo-store-tests-${storeCount++}`,
    db: `furystack-mongo-store-tests-${dbIdx++}`,
    url: mongoDbUrl,
    options: {},
  })
  createStoreTest({
    typeName: 'mongodb-store',
    skipStringTests: true,
    createStore: (i) => {
      const mongoOptions = getMongoOptions(i)
      useMongoDb(mongoOptions)
      const store = i.getInstance(StoreManager).getStoreFor(TestClass, 'id')
      const oldDispose = i[Symbol.asyncDispose]
      i[Symbol.asyncDispose] = async () => {
        const client = await i.getInstance(MongoClientFactory).getClientFor(mongoOptions.url, mongoOptions.options)
        const db = client.db(mongoOptions.db)
        await db.dropDatabase()
        oldDispose.call(i)
      }
      return store
    },
  })

  it('Should retrieve an entity with its id', async () => {
    await usingAsync(new Injector(), async (injector) => {
      useMongoDb({ ...getMongoOptions(injector), model: TestClassWithId, primaryKey: '_id' })
      const store = injector.getInstance(StoreManager).getStoreFor(TestClassWithId, '_id')
      const { created } = await store.add({ value: 'value1' })

      expect(typeof created[0]._id).toBe('string')

      const retrieved = await store.get(created[0]._id)
      expect(retrieved).toEqual(created[0])
    })
  })

  it('Should retrieve more entities with theis ids', async () => {
    await usingAsync(new Injector(), async (injector) => {
      useMongoDb({ ...getMongoOptions(injector), model: TestClassWithId, primaryKey: '_id' })
      const store = injector.getInstance(StoreManager).getStoreFor(TestClassWithId, '_id')
      const { created } = await store.add({ value: 'value1' }, { value: 'value2' }, { value: 'value3' })
      const retrieved = await store.find({ filter: { _id: { $in: created.map((c) => c._id) } } })
      expect(retrieved.length).toBe(3)
      expect(retrieved).toEqual(created)
    })
  })
})
