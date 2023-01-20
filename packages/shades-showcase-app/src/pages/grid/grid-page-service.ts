import { addStore, InMemoryStore, TestClass } from '@furystack/core'
import { getRepository, getDataSetFor } from '@furystack/repository'
import { Injectable, Injected, Injector } from '@furystack/inject'
import type { EntryLoader } from '@furystack/shades-common-components'
import { CollectionService } from '@furystack/shades-common-components'
import type { Disposable } from '@furystack/utils'

let currentId = 0

@Injectable({ lifetime: 'singleton' })
export class GridPageService implements Disposable {
  private isInitialized = false

  public init() {
    if (!this.isInitialized) {
      addStore(this.injector, new InMemoryStore({ model: TestClass, primaryKey: 'id' }))
      getRepository(this.injector).createDataSet(TestClass, 'id')
      this.fillStore()
    }
    return this
  }

  public readonly collectionService = new CollectionService<TestClass>({
    loader: (options) => this.entityLoader(options),
    defaultSettings: {},
    searchField: 'stringValue1',
  })
  private fillStore = async (count = 100) => {
    const store = getDataSetFor(this.injector, TestClass, 'id')
    const entries = new Array(count).fill(null).map(() => this.createTestClassInstance())
    await store.add(this.injector, ...entries)
  }

  private createTestClassInstance = () => {
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
    } as TestClass
  }

  private entityLoader: EntryLoader<TestClass> = async (options) => {
    const dataSet = await getDataSetFor(this.injector, TestClass, 'id')
    const result = await dataSet.find(this.injector, options)
    const totalCount = await dataSet.count(this.injector)
    return {
      count: totalCount,
      entries: result,
    }
  }

  @Injected(Injector)
  private readonly injector!: Injector

  public dispose() {
    this.collectionService.dispose()
  }
}
