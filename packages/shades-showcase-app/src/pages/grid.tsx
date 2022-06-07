import { createComponent, Shade } from '@furystack/shades'
import { addStore, InMemoryStore, TestClass } from '@furystack/core'
import { getRepository, getDataSetFor } from '@furystack/repository'
import { Injectable, Injector } from '@furystack/inject'
import { CollectionService, DataGrid, EntryLoader } from '@furystack/shades-common-components'

@Injectable({ lifetime: 'singleton' })
class GridPageService {
  public readonly collectionService: CollectionService<TestClass>
  private fillStore = async (count = 100) => {
    const store = getDataSetFor(this.injector, TestClass, 'id')
    const entries = new Array(count).fill(this.createTestClassInstance())
    await store.add(this.injector, ...entries)
  }

  private createTestClassInstance = () => {
    const dateValue = new Date()
    dateValue.setHours(dateValue.getHours() + Math.floor((Math.random() - 0.5) * 24))
    return {
      id: Math.floor(Math.random() * 100000),
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

  constructor(private readonly injector: Injector) {
    addStore(this.injector, new InMemoryStore({ model: TestClass, primaryKey: 'id' }))
    getRepository(this.injector).createDataSet(TestClass, 'id')
    this.fillStore()

    this.collectionService = new CollectionService<TestClass>((options) => this.entityLoader(options), {})
  }
}

export const GridPage = Shade<{}, { service: GridPageService }>({
  shadowDomName: 'shades-grid-page',
  getInitialState: ({ injector }) => {
    return {
      service: injector.getInstance(GridPageService),
    }
  },
  render: ({ getState }) => {
    return (
      <div>
        <h1>Grid page</h1>
        <DataGrid<TestClass>
          columns={[]}
          styles={undefined}
          service={getState().service.collectionService}
          headerComponents={{}}
          rowComponents={{}}
        />
      </div>
    )
  },
})
