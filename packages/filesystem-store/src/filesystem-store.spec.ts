import { promises } from 'fs'
import { FileSystemStore } from './filesystem-store.js'
import { TestClass, createStoreTest } from '@furystack/core/create-physical-store-tests'
import { sleepAsync } from '@furystack/utils'
import type { Injector } from '@furystack/inject'
import { useFileSystemStore } from './store-manager-helpers.js'
import { describe, it, expect, vi, afterAll } from 'vitest'
import { StoreManager } from '@furystack/core'

let storeCount = 0

describe('FileSystemStore', () => {
  const storeNames: string[] = []
  const createStore = (i: Injector) => {
    const fileName = `filestore-test-${storeCount++}.json`
    storeNames.push(fileName)

    useFileSystemStore({
      injector: i,
      model: TestClass,
      fileName,
      primaryKey: 'id',
    })

    return i.getInstance(StoreManager).getStoreFor(TestClass, 'id')
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
    for (const fileName of storeNames) {
      try {
        await promises.unlink(fileName)
      } catch (error) {
        // Ignore, maybe already deleted
      }
    }
  })
})
