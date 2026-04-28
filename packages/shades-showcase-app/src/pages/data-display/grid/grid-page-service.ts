import type { FindOptions } from '@furystack/core'
import { defineStore, InMemoryStore, useSystemIdentityContext, type StoreToken } from '@furystack/core'
import type { Token } from '@furystack/inject'
import { defineServiceAsync } from '@furystack/inject'
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

/**
 * Shape returned to consumers after the factory has finished seeding the demo
 * store and wiring the find-options → collection-service pipeline. Consumers
 * receive this value via {@link Injector.getAsync} and can treat it as fully
 * initialized — no explicit `init()` step, no readiness flag.
 */
export interface GridPageService {
  readonly findOptions: ObservableValue<FindOptions<GameItem, Array<keyof GameItem>>>
  readonly collectionService: CollectionService<GameItem>
}

/**
 * Async-bootstrapped singleton for the Grid showcase page. Resolves via
 * {@link Injector.getAsync}; the factory seeds 100 demo items into the
 * in-memory dataset, subscribes the collection-service to find-options
 * changes, and runs the first refresh before the promise settles.
 *
 * The token is the reference implementation for the v7 async-bootstrap
 * pattern documented in `docs/migrations/v7-functional-di.md`:
 * "a service whose instance requires async setup exposes itself as an
 * async token and is consumed via `injector.getAsync` from a route-level
 * loader (e.g. inside `<LazyLoad>`), then passed into the page component
 * as an explicit prop."
 */
export const GridPageService: Token<GridPageService, 'singleton', true> = defineServiceAsync({
  name: 'showcase/GridPageService',
  lifetime: 'singleton',
  factory: async ({ inject, injector, onDispose }) => {
    const findOptions = new ObservableValue<FindOptions<GameItem, Array<keyof GameItem>>>({})
    const collectionService = new CollectionService<GameItem>({ searchField: 'name' })
    const dataSet = inject(GameItemDataSet)
    const systemScope = useSystemIdentityContext({ injector, username: 'showcase' })

    // Monotonically increasing id so that rapid `findOptions` changes can't
    // apply stale results out of order -- only the most recently issued
    // request is allowed to write back into `collectionService.data`.
    let latestRequestId = 0
    const updateCollectionService = async (newFindOptions: FindOptions<GameItem, Array<keyof GameItem>>) => {
      const requestId = ++latestRequestId
      const entries = await dataSet.find(systemScope, newFindOptions)
      const count = await dataSet.count(systemScope, newFindOptions.filter)
      if (requestId !== latestRequestId) return
      collectionService.data.setValue({
        count,
        entries,
      })
    }

    const seedEntries = new Array(100).fill(null).map(() => createGameItem())
    await dataSet.add(systemScope, ...seedEntries)

    findOptions.subscribe((newValue) => void updateCollectionService(newValue))
    await updateCollectionService(findOptions.getValue())

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
    }
  },
})
