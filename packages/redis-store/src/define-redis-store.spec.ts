import { describe, expect, it } from 'vitest'
import type { createClient } from 'redis'
import { defineRedisStore } from './define-redis-store.js'

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
