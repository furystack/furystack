import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import { getDataSetFor, getRepository } from './helpers'
import { addStore, InMemoryStore } from '@furystack/core'
import { DataSet } from './data-set'
import { describe, expect, it } from 'vitest'

describe('Repository', () => {
  it('Should retrieve a dataSet', () => {
    using(new Injector(), (i) => {
      class ExampleClass {
        id!: number
      }
      addStore(i, new InMemoryStore({ model: ExampleClass, primaryKey: 'id' }))
      getRepository(i).createDataSet(ExampleClass, 'id', {})

      const dataSet = getDataSetFor(i, ExampleClass, 'id')
      expect(dataSet).toBeInstanceOf(DataSet)
    })
  })
})
