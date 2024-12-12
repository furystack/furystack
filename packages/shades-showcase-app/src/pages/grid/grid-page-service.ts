import type { FindOptions } from '@furystack/core'
import { addStore, InMemoryStore } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { getDataSetFor, getRepository, type DataSet } from '@furystack/repository'
import { CollectionService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { TestClass } from './test-class.js'

let currentId = 0

@Injectable({ lifetime: 'singleton' })
export class GridPageService implements Disposable {
  private isInitialized = false

  public findOptions = new ObservableValue<FindOptions<TestClass, Array<keyof TestClass>>>({})

  private async updateCollectionService(injector: Injector, newFindOptions: FindOptions<TestClass, any>) {
    const entries = await this.dataSet.find(injector, newFindOptions)
    const count = await this.dataSet.count(injector, newFindOptions.filter)
    this.collectionService.data.setValue({
      count,
      entries: entries as TestClass[],
    })
  }

  public async init(injector: Injector) {
    if (!this.isInitialized) {
      this.isInitialized = true
      addStore(injector, new InMemoryStore({ model: TestClass, primaryKey: 'id' }))
      getRepository(injector).createDataSet(TestClass, 'id')
      await this.fillStore(injector)
      this.findOptions.subscribe((newValue) => void this.updateCollectionService(injector, newValue))
      void this.updateCollectionService(injector, this.findOptions.getValue())
    }
    return this
  }

  public readonly collectionService = new CollectionService<TestClass>({
    searchField: 'stringValue1',
  })

  @Injected((injector) => getDataSetFor(injector, TestClass, 'id'))
  declare private dataSet: DataSet<TestClass, 'id'>

  private fillStore = async (injector: Injector, count = 100) => {
    const entries = new Array(count).fill(null).map(() => this.createTestClassInstance())
    await this.dataSet.add(injector, ...entries)
  }

  private createTestClassInstance = (): TestClass => {
    const dateValue = new Date()
    dateValue.setHours(dateValue.getHours() + Math.floor((Math.random() - 0.5) * 24))
    return {
      id: currentId++, // Math.floor(Math.random() * 100000),
      booleanValue: Math.random() > 0.5,
      numberValue1: Math.random() * 100,
      numberValue2: Math.random() * 100,
      dateValue,
      stringValue1: `string value ${Math.random()}`,
      stringValue2: `string value ${Math.random()}`,
    }
  }

  public [Symbol.dispose]() {
    this.collectionService[Symbol.dispose]()
  }
}
