import { describe, expect, it } from 'vitest'
import { defineMongoDbStore } from './define-mongodb-store.js'

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
