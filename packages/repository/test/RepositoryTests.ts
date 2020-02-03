import { DataSet } from '../src/DataSet'
import { Injector } from '@furystack/inject'
import { using } from '@furystack/utils'
import '../src/InjectorExtension'
import '@furystack/logging'
import { InMemoryStore } from '@furystack/core'

describe('Repository', () => {
  it('Should retrieve a dataSet', () => {
    using(new Injector(), i => {
      class ExampleClass {
        id!: number
      }
      i.useLogging()
        .setupStores(sm => sm.addStore(new InMemoryStore({ model: ExampleClass, primaryKey: 'id' })))
        .setupRepository(r => r.createDataSet(ExampleClass, {}))

      const dataSet = i.getDataSetFor(ExampleClass)
      expect(dataSet).toBeInstanceOf(DataSet)
    })
  })
})
