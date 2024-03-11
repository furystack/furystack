import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import { getDataSetFor, getRepository } from './helpers.js'
import { addStore, InMemoryStore } from '@furystack/core'
import { DataSet } from './data-set.js'
import { describe, it, expect } from 'vitest'
import { TestClass } from '@furystack/core/create-physical-store-tests'

describe('Repository', () => {
  it('Should retrieve a dataSet', () => {
    using(new Injector(), (i) => {
      addStore(i, new InMemoryStore({ model: TestClass, primaryKey: 'id' }))
      getRepository(i).createDataSet(TestClass, 'id', {})

      const dataSet = getDataSetFor(i, TestClass, 'id')
      expect(dataSet).toBeInstanceOf(DataSet)
    })
  })
})
