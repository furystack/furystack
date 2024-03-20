import { TestClass } from './test-class.js'
import type { FindOptions } from '@furystack/core'
import { addStore, InMemoryStore } from '@furystack/core'
import { getRepository, getDataSetFor } from '@furystack/repository'
import { Injectable, Injected, Injector } from '@furystack/inject'
import { CollectionService } from '@furystack/shades-common-components'
import { ObservableValue, type Disposable } from '@furystack/utils'

let currentId = 0

@Injectable({ lifetime: 'singleton' })
export class GridPageService implements Disposable {
  private isInitialized = false

  public findOptions = new ObservableValue<FindOptions<TestClass, Array<keyof TestClass>>>({})

  private async updateCollectionService(newFindOptions: FindOptions<TestClass, any>) {
    const dataSet = getDataSetFor(this.injector, TestClass, 'id')
    const entries = await dataSet.find(this.injector, newFindOptions)
    const count = await dataSet.count(this.injector, newFindOptions.filter)
    this.collectionService.data.setValue({
      count,
      entries: entries as TestClass[],
    })
  }

  public async init() {
    if (!this.isInitialized) {
      this.isInitialized = true
      addStore(this.injector, new InMemoryStore({ model: TestClass, primaryKey: 'id' }))
      getRepository(this.injector).createDataSet(TestClass, 'id')
      await this.fillStore()
      this.findOptions.subscribe((newValue) => this.updateCollectionService(newValue))
      this.updateCollectionService(this.findOptions.getValue())
    }
    return this
  }

  public readonly collectionService = new CollectionService<TestClass>({
    searchField: 'stringValue1',
  })
  private fillStore = async (count = 100) => {
    const store = getDataSetFor(this.injector, TestClass, 'id')
    const entries = new Array(count).fill(null).map(() => this.createTestClassInstance())
    await store.add(this.injector, ...entries)
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

  @Injected(Injector)
  private readonly injector!: Injector

  public dispose() {
    this.collectionService.dispose()
  }
}
