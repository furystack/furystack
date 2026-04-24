import { Model } from 'sequelize'
import { describe, expect, it } from 'vitest'
import { defineSequelizeStore } from './define-sequelize-store.js'

class Item {
  declare id: number
  declare name: string
}

class ItemSequelizeClass extends Model<Item, Item> implements Item {
  declare id: number
  declare name: string
}

describe('defineSequelizeStore (metadata)', () => {
  it('propagates name, lifetime, model and primaryKey onto the returned token', () => {
    const token = defineSequelizeStore<Item, ItemSequelizeClass, 'id'>({
      name: 'test/SequelizeItems',
      model: Item,
      sequelizeModel: ItemSequelizeClass,
      primaryKey: 'id',
      options: { dialect: 'sqlite', storage: ':memory:', logging: false },
    })
    expect(token.name).toBe('test/SequelizeItems')
    expect(token.lifetime).toBe('singleton')
    expect(token.model).toBe(Item)
    expect(token.primaryKey).toBe('id')
  })

  it('mints a distinct token identity per call even when options match -- declare once at module scope', () => {
    const a = defineSequelizeStore<Item, ItemSequelizeClass, 'id'>({
      name: 'test/SequelizeDupe',
      model: Item,
      sequelizeModel: ItemSequelizeClass,
      primaryKey: 'id',
      options: { dialect: 'sqlite', storage: ':memory:', logging: false },
    })
    const b = defineSequelizeStore<Item, ItemSequelizeClass, 'id'>({
      name: 'test/SequelizeDupe',
      model: Item,
      sequelizeModel: ItemSequelizeClass,
      primaryKey: 'id',
      options: { dialect: 'sqlite', storage: ':memory:', logging: false },
    })
    expect(a.id).not.toBe(b.id)
  })
})
