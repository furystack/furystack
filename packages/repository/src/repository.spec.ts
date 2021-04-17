import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import './injector-extension'
import { InMemoryStore } from '@furystack/core'
import { DataSet } from './data-set'

describe('Repository', () => {
  it('Should retrieve a dataSet', () => {
    using(new Injector(), (i) => {
      class ExampleClass {
        id!: number
      }
      i.setupStores((sm) =>
        sm.addStore(new InMemoryStore({ model: ExampleClass, primaryKey: 'id' })),
      ).setupRepository((r) => r.createDataSet(ExampleClass, 'id', {}))

      const dataSet = i.getDataSetFor(ExampleClass, 'id')
      expect(dataSet).toBeInstanceOf(DataSet)
    })
  })
})
