import { describe, expect, it } from 'vitest'
import { defineFileSystemStore } from './define-filesystem-store.js'

class Item {
  declare id: string
  declare value: string
}

describe('defineFileSystemStore (metadata)', () => {
  it('propagates name, lifetime, model and primaryKey onto the returned token', () => {
    const token = defineFileSystemStore<Item, 'id'>({
      name: 'test/FsUserStore',
      model: Item,
      primaryKey: 'id',
      fileName: 'fs-store-meta-test.json',
    })
    expect(token.name).toBe('test/FsUserStore')
    expect(token.lifetime).toBe('singleton')
    expect(token.model).toBe(Item)
    expect(token.primaryKey).toBe('id')
  })

  it('mints a distinct token identity per call even when options match -- declare once at module scope', () => {
    const options = {
      name: 'test/FsDupe',
      model: Item,
      primaryKey: 'id',
      fileName: 'fs-store-dupe-test.json',
    } as const
    const a = defineFileSystemStore<Item, 'id'>(options)
    const b = defineFileSystemStore<Item, 'id'>(options)
    expect(a.id).not.toBe(b.id)
  })
})
