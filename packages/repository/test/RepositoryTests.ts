import { Injector } from '@furystack/inject'
import { using } from '@sensenet/client-utils'
import '../src/InjectorExtension'
import '@furystack/logging'
import { InMemoryStore } from '@furystack/core'
import { DataSet } from '../src/DataSet'

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
