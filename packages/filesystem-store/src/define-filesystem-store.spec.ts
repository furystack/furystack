import { createInjector } from '@furystack/inject'
import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineFileSystemStore } from './define-filesystem-store.js'
import { FileSystemStore } from './filesystem-store.js'

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

describe('defineFileSystemStore (factory + disposal)', () => {
  let workDir: string
  let fileName: string

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'fs-store-spec-'))
    fileName = join(workDir, 'items.json')
  })

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true })
  })

  it('instantiates a FileSystemStore that forwards model, primaryKey and fileName', async () => {
    const Token = defineFileSystemStore<Item, 'id'>({
      name: 'test/FsFactory',
      model: Item,
      primaryKey: 'id',
      fileName,
      tickMs: 60_000,
    })
    const injector = createInjector()
    try {
      const store = injector.get(Token) as FileSystemStore<Item, 'id'>
      expect(store).toBeInstanceOf(FileSystemStore)
      expect(store.model).toBe(Item)
      expect(store.primaryKey).toBe('id')

      await store.add({ id: '1', value: 'alpha' })
      await store.saveChanges()
      const persisted = JSON.parse((await readFile(fileName)).toString()) as Item[]
      expect(persisted).toEqual([{ id: '1', value: 'alpha' }])
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('flushes pending changes when the owning injector is disposed', async () => {
    const Token = defineFileSystemStore<Item, 'id'>({
      name: 'test/FsDispose',
      model: Item,
      primaryKey: 'id',
      fileName,
      tickMs: 60_000,
    })
    const injector = createInjector()
    const store = injector.get(Token) as FileSystemStore<Item, 'id'>
    await store.add({ id: '1', value: 'bravo' })
    expect(store.hasChanges).toBe(true)

    await injector[Symbol.asyncDispose]()

    expect(store.hasChanges).toBe(false)
    const persisted = JSON.parse((await readFile(fileName)).toString()) as Item[]
    expect(persisted).toEqual([{ id: '1', value: 'bravo' }])
  })
})
