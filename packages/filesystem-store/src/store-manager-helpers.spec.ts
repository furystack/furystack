import { promises, existsSync } from 'fs'
import { FileSystemStore } from './index'
import { useFileSystemStore } from './store-manager-helpers'
import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { StoreManager, TestClass } from '@furystack/core'
import { afterAll, describe, expect, it } from 'vitest'

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
