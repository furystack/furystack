import type { Constructable, StoreToken, WithOptionalId } from '@furystack/core'
import type { ServiceContext, Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import type { DataSetSettings } from './data-set-setting.js'
import { DataSet } from './data-set.js'

/**
 * A DI token that resolves to a {@link DataSet} and carries its model and
 * primary key metadata (mirrored from the backing {@link StoreToken}).
 *
 * Consumers can `injector.get(token)` to obtain the dataset, or read the
 * `model` / `primaryKey` fields to drive reflection-style tooling such as
 * entity sync and OpenAPI generation.
 */
export type DataSetToken<T, TPrimaryKey extends keyof T, TWritableData = WithOptionalId<T, TPrimaryKey>> = Token<
  DataSet<T, TPrimaryKey, TWritableData>,
  'singleton'
> & {
  readonly model: Constructable<T>
  readonly primaryKey: TPrimaryKey
}

/**
 * Settings accepted by {@link defineDataSet}. A subset of
 * {@link DataSetSettings}: the physical store is supplied by the store token
 * and must not be passed here.
 */
export type DefineDataSetSettings<
  T,
  TPrimaryKey extends keyof T,
  TWritableData = WithOptionalId<T, TPrimaryKey>,
> = Omit<DataSetSettings<T, TPrimaryKey, TWritableData>, 'physicalStore'>

/**
 * Options accepted by {@link defineDataSet}.
 *
 * `settings` is wrapped in `NoInfer` so the `store` token alone fixes the
 * generic parameters. Without it, an inline callback inside `settings`
 * (e.g. a `modifyOnAdd` arrow) triggers bidirectional inference where
 * TypeScript widens `TPrimaryKey` back to `keyof T` to satisfy the
 * callback's contextual typing.
 */
export type DefineDataSetOptions<T, TPrimaryKey extends keyof T, TWritableData = WithOptionalId<T, TPrimaryKey>> = {
  /**
   * Human-readable identifier used for debug/readability. Token identity is
   * established by the returned {@link DataSetToken} object reference.
   */
  name: string
  /**
   * The store this data set is backed by. Its `model` and `primaryKey` are
   * propagated onto the returned token.
   */
  store: StoreToken<T, TPrimaryKey>
  /**
   * Authorizers, modification hooks and filter post-processors. Optional —
   * a data set without settings performs no authorization and forwards
   * operations straight to the physical store.
   */
  settings?: NoInfer<DefineDataSetSettings<T, TPrimaryKey, TWritableData>>
}

/**
 * Defines a {@link DataSet} as a first-class DI token backed by a
 * {@link StoreToken}.
 *
 * The returned token resolves to a singleton `DataSet`. On the first
 * resolution the factory:
 *
 * 1. Resolves the backing physical store through the injector.
 * 2. Constructs a {@link DataSet} with the supplied {@link DefineDataSetSettings}
 *    and that store.
 * 3. Registers a disposal callback that clears the DataSet's event
 *    subscriptions when the owning injector is disposed.
 *
 * The token also carries the `model` and `primaryKey` of the backing store so
 * that downstream tooling (entity sync, OpenAPI generators, test harnesses)
 * can discover the dataset's shape without additional wiring.
 *
 * @example
 * ```ts
 * const UserStore = defineStore({
 *   name: 'my-app/UserStore',
 *   model: User,
 *   primaryKey: 'username',
 *   factory: () => new InMemoryStore({ model: User, primaryKey: 'username' }),
 * })
 *
 * export const UserDataSet = defineDataSet({
 *   name: 'my-app/UserDataSet',
 *   store: UserStore,
 *   settings: {
 *     authorizeAdd: async ({ injector, entity }) => ({ isAllowed: true }),
 *   },
 * })
 *
 * const ds = injector.get(UserDataSet)
 * await ds.add(injector, { username: 'alice', roles: [] })
 * ```
 */
export const defineDataSet = <T, const TPrimaryKey extends keyof T, TWritableData = WithOptionalId<T, TPrimaryKey>>(
  options: DefineDataSetOptions<T, TPrimaryKey, TWritableData>,
): DataSetToken<T, TPrimaryKey, TWritableData> => {
  const token = defineService({
    name: options.name,
    lifetime: 'singleton',
    factory: (ctx: ServiceContext<'singleton'>) => {
      const physicalStore = ctx.inject(options.store) as unknown as DataSetSettings<
        T,
        TPrimaryKey,
        TWritableData
      >['physicalStore']
      const dataSet = new DataSet<T, TPrimaryKey, TWritableData>({
        ...options.settings,
        physicalStore,
      } as DataSetSettings<T, TPrimaryKey, TWritableData>)
      // Disposal is delegated to the injector via `onDispose`; the dataset
      // outlives this factory invocation and is torn down on scope teardown.
      // eslint-disable-next-line furystack/prefer-using-wrapper
      ctx.onDispose(() => dataSet[Symbol.dispose]())
      return dataSet
    },
  })
  const result: DataSetToken<T, TPrimaryKey, TWritableData> = Object.assign(token, {
    model: options.store.model,
    primaryKey: options.store.primaryKey,
  })
  return result
}
