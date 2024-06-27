import { StoreManager } from '@furystack/core'
import { Injector } from '@furystack/inject'
import { createClient } from 'redis'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RedisStore } from './redis-store.js'
import { useRedis } from './store-manager-helpers.js'

const redisUrl = process?.env?.REDIS_URL || 'redis://localhost:6379'

describe('Redis Store', () => {
  class ExampleClass {
    declare id: string
    declare value: string
  }

  let i!: Injector
  let store!: RedisStore<ExampleClass, 'id'>
  let client!: ReturnType<typeof createClient>

  beforeEach(async () => {
    client = createClient({ url: redisUrl })
    i = new Injector()
    useRedis({ injector: i, model: ExampleClass, primaryKey: 'id', client })
    store = i.getInstance(StoreManager).getStoreFor(ExampleClass, 'id')
    await client.connect()
  })

  afterEach(async () => {
    await client.quit()
    await store[Symbol.dispose]()
    await i[Symbol.asyncDispose]()
  })

  it('Should be a RedisStore instance', () => {
    expect(store).toBeInstanceOf(RedisStore)
  })

  it('Should add an entity', async () => {
    const entityToAdd: ExampleClass = { id: 'something', value: 'value' }
    await store.add(entityToAdd)
    const retrieved = await store.get(entityToAdd.id)
    expect(retrieved).toEqual(entityToAdd)
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
    await expect(store.find()).rejects.toThrow()
  })
})
