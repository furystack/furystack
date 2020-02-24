import { Injector } from '@furystack/inject'
import { createClient, RedisClient } from 'redis'
import { StoreManager } from '@furystack/core'
import '@furystack/logging'
import { v4 } from 'uuid'
import { RedisStore } from '.'

describe('Redis Store', () => {
  class ExampleClass {
    id!: string
    value!: string
  }

  let i!: Injector
  let store!: RedisStore<ExampleClass, 'id'>
  let client!: RedisClient

  beforeEach(async () => {
    client = createClient({ port: 6379, host: 'localhost' })
    i = new Injector().useLogging().setupStores(sm => sm.useRedis(ExampleClass, 'id', client))
    store = i.getInstance(StoreManager).getStoreFor(ExampleClass)
  })

  afterEach(async () => {
    client.end(false)
    await store.dispose()
    await i.dispose()
  })

  it('Should be a RedisStore instance', () => {
    expect(store).toBeInstanceOf(RedisStore)
  })

  it('Should add an entity', async () => {
    const entityToAdd: ExampleClass = { id: v4(), value: v4() }
    await store.add(entityToAdd)
    const retrieved = await store.get(entityToAdd.id)
    expect(retrieved).toStrictEqual(entityToAdd)
    await store.update(entityToAdd.id, { ...entityToAdd, value: 'updatedValue' })
    const updated = await store.get(entityToAdd.id)
    expect(updated && updated.value).toBe('updatedValue')
    await store.remove(entityToAdd.id)
    const deleted = await store.get(entityToAdd.id)
    expect(deleted).toBeFalsy()
  })

  it('Should throw on count', async () => {
    await expect(store.count()).rejects.toThrow()
  })

  it('Should throw on search', async () => {
    await expect(store.search()).rejects.toThrow()
  })
})
