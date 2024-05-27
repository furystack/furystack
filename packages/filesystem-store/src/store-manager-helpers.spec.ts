import { promises, existsSync } from 'fs'
import { FileSystemStore } from './index.js'
import { useFileSystemStore } from './store-manager-helpers.js'
import { using } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'
import { describe, it, expect, afterAll } from 'vitest'
import { TestClass } from '@furystack/core/create-physical-store-tests'

let storeCount = 0

describe('FileSystemStore store manager extensions', () => {
  const storeNames: string[] = []

  it('Should create a store with an extensions method from Store Manages', () => {
    using(new Injector(), (i) => {
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
