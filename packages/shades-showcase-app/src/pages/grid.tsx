import { createComponent, Shade } from '@furystack/shades'
import { addStore, InMemoryStore, TestClass } from '@furystack/core'
import { getRepository, getDataSetFor } from '@furystack/repository'
import { Injectable, Injected, Injector } from '@furystack/inject'
import { CollectionService, DataGrid, EntryLoader, SelectionCell } from '@furystack/shades-common-components'

@Injectable({ lifetime: 'singleton' })
class GridPageService {
  private isInitialized = false

  public init() {
    if (!this.isInitialized) {
      addStore(this.injector, new InMemoryStore({ model: TestClass, primaryKey: 'id' }))
      getRepository(this.injector).createDataSet(TestClass, 'id')
      this.fillStore()
    }
    return this
  }

  public readonly collectionService = new CollectionService<TestClass>((options) => this.entityLoader(options), {})
  private fillStore = async (count = 100) => {
    const store = getDataSetFor(this.injector, TestClass, 'id')
    const entries = new Array(count).fill(null).map(() => this.createTestClassInstance())
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

  @Injected(Injector)
  private readonly injector!: Injector
}

export const GridPage = Shade<{}, { service: GridPageService }>({
  shadowDomName: 'shades-grid-page',
  getInitialState: ({ injector }) => {
    return {
      service: injector.getInstance(GridPageService).init(),
    }
  },
  render: ({ getState }) => {
    return (
      <div
        style={{
          height: 'calc(100% - 96px)',
        }}
      >
        <h1>Grid</h1>
        <DataGrid<TestClass>
          columns={['id', 'stringValue1', 'stringValue2', 'booleanValue', 'dateValue', 'numberValue1', 'numberValue2']}
          styles={undefined}
          service={getState().service.collectionService}
          headerComponents={{}}
          rowComponents={{
            id: (entry) => <SelectionCell entry={entry} service={getState().service.collectionService} />,
            booleanValue: ({ booleanValue }) => <span>{booleanValue ? `✅` : `❌`}</span>,
            dateValue: ({ dateValue }) => <span>{dateValue.toLocaleString()}</span>,
            numberValue1: ({ numberValue1 }) => <span>{numberValue1.toFixed(2)}</span>,
            numberValue2: ({ numberValue2 }) => <span>{numberValue2.toFixed(2)}</span>,
          }}
        />
      </div>
    )
  },
})
