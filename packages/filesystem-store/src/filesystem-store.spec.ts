import { promises, existsSync } from 'fs'
import { FileSystemStore } from './filesystem-store.js'
import { TestClass, createStoreTest } from '@furystack/core'
import { sleepAsync } from '@furystack/utils'
import { afterAll, describe, expect, it, vi } from 'vitest'

let storeCount = 0

describe('FileSystemStore', () => {
  const storeNames: string[] = []
  const createStore = () => {
    const fileName = `filestore-test-${storeCount++}.json`
    storeNames.push(fileName)
    return new FileSystemStore({ model: TestClass, fileName, primaryKey: 'id' })
  }

  createStoreTest({
    createStore,
    typeName: 'FileStore',
  })

  it('Should save data on tick', async () => {
    const fileName = `filestore-test-${storeCount++}.json`
    storeNames.push(fileName)
    const store = new FileSystemStore({ model: TestClass, fileName, primaryKey: 'id', tickMs: 500 })
    store.saveChanges = vi.fn(store.saveChanges.bind(store))

    await store.add({
      id: 1,
      dateValue: new Date(),
      stringValue1: 'alma',
      stringValue2: 'korte',
      booleanValue: false,
      numberValue1: 1,
      numberValue2: 2,
    })
    await sleepAsync(501)
    expect(store.saveChanges).toHaveBeenCalled()

    await store.dispose()
  })

  it('Should reload data from disk', async () => {
    const fileName = `filestore-test-${storeCount++}.json`
    storeNames.push(fileName)
    const store = new FileSystemStore({ model: TestClass, fileName, primaryKey: 'id', tickMs: 500 })
    await store.add({
      id: 1,
      dateValue: new Date(),
      stringValue1: 'alma',
      stringValue2: 'korte',
      booleanValue: false,
      numberValue1: 1,
      numberValue2: 2,
    })
    await store.saveChanges()
    await store.remove(1)
    await store.reloadData()
    const count = await store.count()
    expect(count).toBe(1)
    await store.dispose()
  })

  afterAll(async () => {
    await Promise.all(
      storeNames.map(async (fileName) => {
        if (existsSync(fileName)) {
          await promises.unlink(fileName)
        }
      }),
    )
  })
})
