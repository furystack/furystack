import { StoreManager } from '@furystack/core'
import { TestClass, createStoreTest } from '@furystack/core/create-physical-store-tests'
import type { Injector } from '@furystack/inject'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { promises } from 'fs'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { FileSystemStore } from './filesystem-store.js'
import { useFileSystemStore } from './store-manager-helpers.js'

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
    await usingAsync(
      new FileSystemStore({ model: TestClass, fileName, primaryKey: 'id', tickMs: 500 }),
      async (store) => {
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
      },
    )
  })

  it('Should reload data from disk', async () => {
    const fileName = `filestore-test-${storeCount++}.json`
    storeNames.push(fileName)
    await usingAsync(
      new FileSystemStore({ model: TestClass, fileName, primaryKey: 'id', tickMs: 500 }),
      async (store) => {
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
      },
    )
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
