import { NotSupportedError } from '@furystack/core'
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
  }

  const setupRedisStore = async () => {
    const client = createClient({ url: redisUrl })
    const injector = createInjector()
    const token = defineRedisStore<ExampleClass, 'id'>({
      name: 'redis-store/ExampleClass',
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

  it('Should throw NotSupportedError on count', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
      await expect(store.count()).rejects.toBeInstanceOf(NotSupportedError)
    })
  })

  it('Should throw NotSupportedError on search', async () => {
    await usingAsync(await setupRedisStore(), async ({ store }) => {
      await expect(store.find({})).rejects.toBeInstanceOf(NotSupportedError)
    })
  })
})
