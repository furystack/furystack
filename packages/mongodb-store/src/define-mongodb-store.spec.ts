import { createInjector } from '@furystack/inject'
import type { MongoClient } from 'mongodb'
import { describe, expect, it, vi } from 'vitest'
import { defineMongoDbStore } from './define-mongodb-store.js'
import { MongoClientFactory } from './mongo-client-factory.js'
import { MongodbStore } from './mongodb-store.js'

class Item {
  declare id: string
  declare value: string
}

describe('defineMongoDbStore (metadata)', () => {
  it('propagates name, lifetime, model and primaryKey onto the returned token', () => {
    const token = defineMongoDbStore<Item, 'id'>({
      name: 'test/MongoItems',
      model: Item,
      primaryKey: 'id',
      url: 'mongodb://localhost:27017',
      db: 'unit-test',
      collection: 'items',
    })
    expect(token.name).toBe('test/MongoItems')
    expect(token.lifetime).toBe('singleton')
    expect(token.model).toBe(Item)
    expect(token.primaryKey).toBe('id')
  })

  it('mints a distinct token identity per call even when options match -- declare once at module scope', () => {
    const options = {
      name: 'test/MongoDupe',
      model: Item,
      primaryKey: 'id' as const,
      url: 'mongodb://localhost:27017',
      db: 'unit-test',
      collection: 'items',
    }
    const a = defineMongoDbStore<Item, 'id'>(options)
    const b = defineMongoDbStore<Item, 'id'>(options)
    expect(a.id).not.toBe(b.id)
  })
})

describe('defineMongoDbStore (factory + disposal)', () => {
  const buildClientStub = () => {
    const createIndex = vi.fn<() => Promise<string>>(() => Promise.resolve('id_1'))
    const collection = vi.fn(() => ({ createIndex }))
    const db = vi.fn(() => ({ collection }))
    const client = { db } as unknown as MongoClient
    return { client, db, collection, createIndex }
  }

  it('instantiates a MongodbStore whose lazy client pulls from the injected MongoClientFactory with the right url', async () => {
    const { client, db, collection, createIndex } = buildClientStub()
    const getClientFor = vi.fn(() => client)

    const Token = defineMongoDbStore<Item, 'id'>({
      name: 'test/MongoFactory',
      model: Item,
      primaryKey: 'id',
      url: 'mongodb://stub-host:1234',
      db: 'unit-db',
      collection: 'unit-coll',
      options: { appName: 'spec' },
    })

    const injector = createInjector()
    injector.bind(MongoClientFactory, () => ({ getClientFor }))

    try {
      const store = injector.get(Token) as MongodbStore<Item, 'id'>
      expect(store).toBeInstanceOf(MongodbStore)
      expect(store.model).toBe(Item)
      expect(store.primaryKey).toBe('id')
      expect(getClientFor).not.toHaveBeenCalled()

      await store.getCollection()

      expect(getClientFor).toHaveBeenCalledTimes(1)
      expect(getClientFor).toHaveBeenCalledWith('mongodb://stub-host:1234', { appName: 'spec' })
      expect(db).toHaveBeenCalledWith('unit-db')
      expect(collection).toHaveBeenCalledWith('unit-coll')
      expect(createIndex).toHaveBeenCalledWith({ id: 1 }, { unique: true })
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('disposing the injector tears down the bound MongoClientFactory', async () => {
    const { client } = buildClientStub()
    const getClientFor = vi.fn(() => client)

    const Token = defineMongoDbStore<Item, 'id'>({
      name: 'test/MongoDispose',
      model: Item,
      primaryKey: 'id',
      url: 'mongodb://stub-host:1234',
      db: 'unit-db',
      collection: 'unit-coll',
    })

    const injector = createInjector()
    injector.bind(MongoClientFactory, () => ({ getClientFor }))

    injector.get(Token)
    await expect(injector[Symbol.asyncDispose]()).resolves.toBeUndefined()
  })
})
