import type { FindOptions } from '@furystack/core'
import { addStore, InMemoryStore } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { getDataSetFor, getRepository, type DataSet } from '@furystack/repository'
import { CollectionService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { createGameItem, GameItem } from './game-item.js'

@Injectable({ lifetime: 'singleton' })
export class GridPageService implements Disposable {
  private isInitialized = false

  public findOptions = new ObservableValue<FindOptions<GameItem, Array<keyof GameItem>>>({})

  private async updateCollectionService(injector: Injector, newFindOptions: FindOptions<GameItem, any>) {
    const entries = await this.dataSet.find(injector, newFindOptions)
    const count = await this.dataSet.count(injector, newFindOptions.filter)
    this.collectionService.data.setValue({
      count,
      entries: entries as GameItem[],
    })
  }

  public async init(injector: Injector) {
    if (!this.isInitialized) {
      this.isInitialized = true
      addStore(injector, new InMemoryStore({ model: GameItem, primaryKey: 'id' }))
      getRepository(injector).createDataSet(GameItem, 'id')
      await this.fillStore(injector)
      this.findOptions.subscribe((newValue) => void this.updateCollectionService(injector, newValue))
      void this.updateCollectionService(injector, this.findOptions.getValue())
    }
    return this
  }

  public readonly collectionService = new CollectionService<GameItem>({
    searchField: 'name',
  })

  @Injected((injector) => getDataSetFor(injector, GameItem, 'id'))
  declare private dataSet: DataSet<GameItem, 'id'>

  private fillStore = async (injector: Injector, count = 100) => {
    const entries = new Array(count).fill(null).map(() => createGameItem())
    await this.dataSet.add(injector, ...entries)
  }

  public [Symbol.dispose]() {
    this.findOptions[Symbol.dispose]()
    this.collectionService[Symbol.dispose]()
  }
}
