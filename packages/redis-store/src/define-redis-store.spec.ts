import { createInjector } from '@furystack/inject'
import type { createClient } from 'redis'
import { describe, expect, it, vi } from 'vitest'
import { defineRedisStore } from './define-redis-store.js'
import { RedisStore } from './redis-store.js'

class Item {
  declare id: string
  declare value: string
}

const stubClient = {} as ReturnType<typeof createClient>

describe('defineRedisStore (metadata)', () => {
  it('propagates name, lifetime, model and primaryKey onto the returned token', () => {
    const token = defineRedisStore<Item, 'id'>({
      name: 'test/RedisItems',
      model: Item,
      primaryKey: 'id',
      client: stubClient,
    })
    expect(token.name).toBe('test/RedisItems')
    expect(token.lifetime).toBe('singleton')
    expect(token.model).toBe(Item)
    expect(token.primaryKey).toBe('id')
  })

  it('mints a distinct token identity per call even when options match -- declare once at module scope', () => {
    const a = defineRedisStore<Item, 'id'>({
      name: 'test/RedisDupe',
      model: Item,
      primaryKey: 'id',
      client: stubClient,
    })
    const b = defineRedisStore<Item, 'id'>({
      name: 'test/RedisDupe',
      model: Item,
      primaryKey: 'id',
      client: stubClient,
    })
    expect(a.id).not.toBe(b.id)
  })
})

describe('defineRedisStore (factory + disposal)', () => {
  it('instantiates a RedisStore that uses the supplied client verbatim', async () => {
    const set = vi.fn<() => Promise<string>>(() => Promise.resolve('OK'))
    const client = { set } as unknown as ReturnType<typeof createClient>
    const Token = defineRedisStore<Item, 'id'>({
      name: 'test/RedisFactory',
      model: Item,
      primaryKey: 'id',
      client,
    })
    const injector = createInjector()
    try {
      const store = injector.get(Token)
      expect(store).toBeInstanceOf(RedisStore)
      expect(store.model).toBe(Item)
      expect(store.primaryKey).toBe('id')

      await store.add({ id: '1', value: 'alpha' })
      expect(set).toHaveBeenCalledTimes(1)
      expect(set).toHaveBeenCalledWith('1', JSON.stringify({ id: '1', value: 'alpha' }))
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('ownership of the client stays with the caller -- disposal does not close it', async () => {
    const quit = vi.fn<() => Promise<'OK'>>(() => Promise.resolve('OK'))
    const client = { quit } as unknown as ReturnType<typeof createClient>
    const Token = defineRedisStore<Item, 'id'>({
      name: 'test/RedisDispose',
      model: Item,
      primaryKey: 'id',
      client,
    })
    const injector = createInjector()
    injector.get(Token)

    await injector[Symbol.asyncDispose]()

    expect(quit).not.toHaveBeenCalled()
  })
})
