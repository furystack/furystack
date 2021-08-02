import { promises, existsSync } from 'fs'
import { FileSystemStore } from './index'
import { TestClass } from '@furystack/core/dist/cjs/create-physical-store-tests'
import './store-manager-extensions'
import { v4 } from 'uuid'
import { usingAsync } from '@furystack/utils'
import { Injector } from '@furystack/inject'
import { StoreManager } from '@furystack/core'

describe('FileSystemStore store manager extensions', () => {
  const storeNames: string[] = []

  it('Should create a store with an extensions method from Store Manages', async () => {
    await usingAsync(new Injector(), async (i) => {
      const storeManager = i.getInstance(StoreManager)
      const fileName = `filestore-test-${v4()}.json`
      storeNames.push(fileName)
      const store = storeManager.useFileSystem({
        model: TestClass,
        fileName,
        primaryKey: 'id',
      })
      expect(store.getStoreFor(TestClass, 'id')).toBeInstanceOf(FileSystemStore)
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
