import { promises, existsSync } from 'fs'
import { LoggerCollection } from '@furystack/logging'
import { FileStore } from './file-store'
import { TestClass, createStoreTest } from './create-physical-store-tests'
import { v4 } from 'uuid'

describe('FileStore', () => {
  const storeNames: string[] = []
  const createStore = () => {
    const fileName = `filestore-test-${v4()}.json`
    storeNames.push(fileName)
    return new FileStore({ model: TestClass, fileName, primaryKey: 'id', logger: new LoggerCollection() })
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
