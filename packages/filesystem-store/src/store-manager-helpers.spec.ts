import { StoreManager } from '@furystack/core'
import { TestClass } from '@furystack/core/create-physical-store-tests'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { existsSync, promises } from 'fs'
import { afterAll, describe, expect, it } from 'vitest'
import { FileSystemStore } from './index.js'
import { useFileSystemStore } from './store-manager-helpers.js'

let storeCount = 0

describe('FileSystemStore store manager extensions', () => {
  const storeNames: string[] = []

  it('Should create a store with an extensions method from Store Manages', async () => {
    await usingAsync(new Injector(), async (i) => {
      const storeManager = i.getInstance(StoreManager)
      const fileName = `filestore-test-${storeCount++}.json`
      storeNames.push(fileName)
      useFileSystemStore({
        injector: i,
        model: TestClass,
        fileName,
        primaryKey: 'id',
      })
      expect(storeManager.getStoreFor(TestClass, 'id')).toBeInstanceOf(FileSystemStore)
    })
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
