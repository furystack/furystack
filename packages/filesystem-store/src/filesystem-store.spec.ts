import { promises, existsSync } from 'fs'
import { FileSystemStore } from './filesystem-store'
import { TestClass, createStoreTest } from '@furystack/core/dist/create-physical-store-tests'
import { v4 } from 'uuid'

describe('FileSystemStore', () => {
  const storeNames: string[] = []
  const createStore = () => {
    const fileName = `filestore-test-${v4()}.json`
    storeNames.push(fileName)
    return new FileSystemStore({ model: TestClass, fileName, primaryKey: 'id' })
  }

  createStoreTest({
    createStore,
    typeName: 'FileStore',
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
