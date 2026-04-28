import { TestClass, createStoreTest } from '@furystack/core/create-physical-store-tests'
import type { Injector } from '@furystack/inject'
import { sleepAsync, using, usingAsync } from '@furystack/utils'
import { promises } from 'fs'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineFileSystemStore } from './define-filesystem-store.js'
import { FileSystemStore } from './filesystem-store.js'

let storeCount = 0

describe('FileSystemStore', () => {
  const storeNames: string[] = []
  const createStore = (i: Injector) => {
    const fileName = `filestore-test-${storeCount++}.json`
    storeNames.push(fileName)
    const token = defineFileSystemStore<TestClass, 'id'>({
      name: `FileSystemStore-test-${storeCount}`,
      model: TestClass,
      fileName,
      primaryKey: 'id',
    })
    return i.get(token)
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

  describe('onWatcherError event', () => {
    it('should emit onWatcherError when file watcher registration fails', () => {
      const emitSpy = vi.spyOn(FileSystemStore.prototype, 'emit')
      using(
        new FileSystemStore({
          fileName: '/nonexistent-dir/impossible-path/test.json',
          primaryKey: 'id' as const,
          model: TestClass,
        }),
        () => {
          expect(emitSpy).toHaveBeenCalledWith('onWatcherError', { error: expect.any(Error) as Error })
          emitSpy.mockRestore()
        },
      )
    })
  })

  describe('onLoadError event', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('emits onLoadError when the initial background reload fails', async () => {
      const emitSpy = vi.spyOn(FileSystemStore.prototype, 'emit')
      // Reject the initial readFile call captured by the class field initializer
      // so the constructor-scheduled `reloadData()` rejects with a non-ENOENT error.
      vi.spyOn(promises, 'readFile').mockRejectedValueOnce(new Error('boom'))
      const fileName = `filestore-test-${storeCount++}.json`
      storeNames.push(fileName)
      await usingAsync(new FileSystemStore({ model: TestClass, fileName, primaryKey: 'id' }), async () => {
        await sleepAsync(20)
        expect(emitSpy).toHaveBeenCalledWith('onLoadError', { error: expect.any(Error) as Error })
      })
    })

    it('emits onLoadError when a watcher-triggered reload fails', async () => {
      const fileName = `filestore-test-${storeCount++}.json`
      storeNames.push(fileName)
      await promises.writeFile(fileName, '[]')
      await usingAsync(new FileSystemStore({ model: TestClass, fileName, primaryKey: 'id' }), async (store) => {
        const handler = vi.fn()
        store.addListener('onLoadError', handler)
        await sleepAsync(20)
        // Corrupt the file so the watcher-driven reload hits a JSON.parse error
        await promises.writeFile(fileName, 'not valid json')
        await vi.waitFor(() => {
          expect(handler).toHaveBeenCalledWith({ error: expect.any(Error) as Error })
        })
      })
    })
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
