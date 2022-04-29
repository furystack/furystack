import { Injector } from '@furystack/inject'
import { createClient } from 'redis'
import { StoreManager } from '@furystack/core'
import { RedisStore } from './redis-store'
import './store-manager-helpers'
import { useRedis } from './store-manager-helpers'

describe('Redis Store', () => {
  class ExampleClass {
    id!: string
    value!: string
  }

  let i!: Injector
  let store!: RedisStore<ExampleClass, 'id'>
  let client!: ReturnType<typeof createClient>

  beforeEach(async () => {
    client = createClient({ url: 'redis://localhost:6379' })
    i = new Injector()
    useRedis({ injector: i, model: ExampleClass, primaryKey: 'id', client })
    store = i.getInstance(StoreManager).getStoreFor(ExampleClass, 'id')
    await client.connect()
  })

  afterEach(async () => {
    await client.quit()
    await store.dispose()
    await i.dispose()
  })

  it('Should be a RedisStore instance', () => {
    expect(store).toBeInstanceOf(RedisStore)
  })

  it('Should add an entity', async () => {
    const entityToAdd: ExampleClass = { id: 'something', value: 'value' }
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
    await expect(store.find()).rejects.toThrow()
  })

  it('Should report a healthy status', async () => {
    const status = await store.checkHealth()
    expect(status.healthy).toBe('healthy')
  })

  it('Should report an unhealthy status once disconnected', async () => {
    await store.options.client.quit()
    const status = await store.checkHealth()
    expect(status.healthy).toBe('unhealthy')
    await store.options.client.connect()
  })
})
