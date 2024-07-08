import { InMemoryStore, addStore } from '@furystack/core'
import { TestClass } from '@furystack/core/create-physical-store-tests'
import { Injector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it } from 'vitest'
import { DataSet } from './data-set.js'
import { getDataSetFor, getRepository } from './helpers.js'

describe('Repository', () => {
  it('Should retrieve a dataSet', async () => {
    await usingAsync(new Injector(), async (i) => {
      addStore(i, new InMemoryStore({ model: TestClass, primaryKey: 'id' }))
      getRepository(i).createDataSet(TestClass, 'id', {})

      const dataSet = getDataSetFor(i, TestClass, 'id')
      expect(dataSet).toBeInstanceOf(DataSet)
    })
  })
})
