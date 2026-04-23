import type { FindOptions } from '@furystack/core'
import { defineStore, InMemoryStore, useSystemIdentityContext, type StoreToken } from '@furystack/core'
import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import { defineDataSet, type DataSetToken } from '@furystack/repository'
import { CollectionService } from '@furystack/shades-common-components'
import { ObservableValue } from '@furystack/utils'
import { createGameItem, GameItem } from './game-item.js'

const GameItemStore: StoreToken<GameItem, 'id'> = defineStore<GameItem, 'id'>({
  name: 'showcase/GameItemStore',
  model: GameItem,
  primaryKey: 'id',
  factory: () => new InMemoryStore<GameItem, 'id'>({ model: GameItem, primaryKey: 'id' }),
})

const GameItemDataSet: DataSetToken<GameItem, 'id'> = defineDataSet<GameItem, 'id'>({
  name: 'showcase/GameItemDataSet',
  store: GameItemStore,
})

export interface GridPageService {
  readonly findOptions: ObservableValue<FindOptions<GameItem, Array<keyof GameItem>>>
  readonly collectionService: CollectionService<GameItem>
  init(): Promise<void>
}

export const GridPageService: Token<GridPageService, 'singleton'> = defineService({
  name: 'showcase/GridPageService',
  lifetime: 'singleton',
  factory: ({ inject, injector, onDispose }) => {
    const findOptions = new ObservableValue<FindOptions<GameItem, Array<keyof GameItem>>>({})
    const collectionService = new CollectionService<GameItem>({ searchField: 'name' })
    const dataSet = inject(GameItemDataSet)
    const systemScope = useSystemIdentityContext({ injector, username: 'showcase' })

    let initPromise: Promise<void> | null = null

    const updateCollectionService = async (newFindOptions: FindOptions<GameItem, Array<keyof GameItem>>) => {
      const entries = await dataSet.find(systemScope, newFindOptions)
      const count = await dataSet.count(systemScope, newFindOptions.filter)
      collectionService.data.setValue({
        count,
        entries: entries as GameItem[],
      })
    }

    const fillStore = async (count = 100) => {
      const entries = new Array(count).fill(null).map(() => createGameItem())
      await dataSet.add(systemScope, ...entries)
    }

    const init = (): Promise<void> => {
      if (!initPromise) {
        initPromise = (async () => {
          await fillStore()
          findOptions.subscribe((newValue) => void updateCollectionService(newValue))
          await updateCollectionService(findOptions.getValue())
        })()
      }
      return initPromise
    }

    onDispose(async () => {
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      findOptions[Symbol.dispose]()
      // eslint-disable-next-line furystack/prefer-using-wrapper -- Disposal is deferred to the injector's onDispose hook.
      collectionService[Symbol.dispose]()
      await systemScope[Symbol.asyncDispose]()
    })

    return {
      findOptions,
      collectionService,
      init,
    }
  },
})
