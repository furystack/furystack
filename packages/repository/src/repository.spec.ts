import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import { getRepository } from './helpers'
import { addStore, InMemoryStore } from '@furystack/core'
import { DataSet } from './data-set'

describe('Repository', () => {
  it('Should retrieve a dataSet', () => {
    using(new Injector(), (i) => {
      class ExampleClass {
        id!: number
      }
      addStore(i, new InMemoryStore({ model: ExampleClass, primaryKey: 'id' }))
      getRepository(i).createDataSet(ExampleClass, 'id', {})

      const dataSet = getRepository(i).getDataSetFor(ExampleClass, 'id')
      expect(dataSet).toBeInstanceOf(DataSet)
    })
  })
})
