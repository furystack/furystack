import { randomUUID } from 'node:crypto'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { createClient } from 'redis'
import { describe, expect, it } from 'vitest'
import { defineRedisStore } from './define-redis-store.js'
import { RedisStore } from './redis-store.js'

const redisUrl = process?.env?.REDIS_URL || 'redis://localhost:6379'

describe('Redis Store', () => {
  class ExampleClass {
    declare id: string
    declare value: string
    declare count?: number
    declare tags?: string[]
  }

  const setupRedisStore = async (name = `redis-store/${randomUUID()}`) => {
    const client = createClient({ url: redisUrl })
    const injector = createInjector()
    const token = defineRedisStore<ExampleClass, 'id'>({
      name,
      model: ExampleClass,
      primaryKey: 'id',
      client,
    })
    const store = injector.get(token)
    await client.connect()
    return {
      store,
      [Symbol.asyncDispose]: async () => {
        await client.quit()
        await injector[Symbol.asyncDispose]()
      },
    }
  }

  it('Should be a RedisStore instance', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
      expect(store).toBeInstanceOf(RedisStore)
    })
  })

  it('Should add an entity', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
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
  })

  it('Should merge partial updates without clobbering untouched fields', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
      await store.add({ id: 'm1', value: 'a', count: 1, tags: ['x'] })
      await store.update('m1', { value: 'b' })
      const updated = await store.get('m1')
      expect(updated).toEqual({ id: 'm1', value: 'b', count: 1, tags: ['x'] })
    })
  })

  it('Should preserve empty arrays across a partial update', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
      await store.add({ id: 'm2', value: 'a', tags: [] })
      await store.update('m2', { value: 'b' })
      const updated = await store.get('m2')
      expect(Array.isArray(updated?.tags)).toBe(true)
      expect(updated?.tags).toEqual([])
    })
  })

  it('Should clear a field set to undefined in a partial update', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
      await store.add({ id: 'm3', value: 'a', count: 5 })
      await store.update('m3', { count: undefined })
      const updated = await store.get('m3')
      expect(updated?.count).toBeUndefined()
      expect(Object.prototype.hasOwnProperty.call(updated, 'count')).toBe(false)
    })
  })

  it('Should find entities matching a filter', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
      await store.add({ id: '1', value: 'x' }, { id: '2', value: 'y' }, { id: '3', value: 'x' })
      const matches = await store.find({ filter: { value: { $eq: 'x' } } })
      expect(matches.map((entity) => entity.id).sort()).toEqual(['1', '3'])
    })
  })

  it('Should count entities with and without a filter', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
      await store.add({ id: '1', value: 'x' }, { id: '2', value: 'y' }, { id: '3', value: 'x' })
      expect(await store.count()).toBe(3)
      expect(await store.count({ value: { $eq: 'x' } })).toBe(2)
    })
  })

  it('Should drop an entity from find results after remove', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
      await store.add({ id: '1', value: 'x' }, { id: '2', value: 'y' })
      await store.remove('1')
      const all = await store.find({})
      expect(all.map((entity) => entity.id)).toEqual(['2'])
      expect(await store.count()).toBe(1)
    })
  })

  it('Should scope find to its own namespace on a shared keyspace', async () => {
    await usingAsync(await setupRedisStore(`store-a/${randomUUID()}`), async ({ store: storeA }) => {
      await usingAsync(await setupRedisStore(`store-b/${randomUUID()}`), async ({ store: storeB }) => {
        // Same primary key in both stores — only the namespace differs.
        await storeA.add({ id: '1', value: 'from-a' })
        await storeB.add({ id: '1', value: 'from-b' })

        expect(await storeA.find({})).toEqual([{ id: '1', value: 'from-a' }])
        expect(await storeB.find({})).toEqual([{ id: '1', value: 'from-b' }])
      })
    })
  })
})
