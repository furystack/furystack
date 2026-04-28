import type { Constructable, PhysicalStore, StoreToken, WithOptionalId } from '@furystack/core'
import type { ServiceContext, Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import type { DataSetSettings } from './data-set-setting.js'
import { DataSet } from './data-set.js'

/**
 * Resolves a {@link StoreToken} to a {@link PhysicalStore} whose
 * `TWritableData` generic matches the owning data set. `StoreToken` defaults
 * `TWritableData` to `WithOptionalId`, while a {@link DataSet} may narrow it
 * (e.g. to strip system-owned fields). The write surface of `PhysicalStore`
 * is contravariant in `TWritableData` — a store that accepts
 * `WithOptionalId<T, TPK>` also accepts any narrower shape — but TypeScript
 * cannot express that with the default generic, so the cast is localized
 * here with this explanation rather than scattered at call sites.
 */
const resolvePhysicalStore = <T, TPrimaryKey extends keyof T, TWritableData>(
  ctx: ServiceContext<'singleton'>,
  store: StoreToken<T, TPrimaryKey>,
): PhysicalStore<T, TPrimaryKey, TWritableData> =>
  ctx.inject(store) as unknown as PhysicalStore<T, TPrimaryKey, TWritableData>

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
   * Debug-only identifier. Token identity is established by the returned
   * {@link DataSetToken} object reference, not this string.
   */
  name: string
  /** Backing store; its `model` and `primaryKey` propagate to the returned token. */
  store: StoreToken<T, TPrimaryKey>
  settings?: NoInfer<DefineDataSetSettings<T, TPrimaryKey, TWritableData>>
}

/**
 * Defines a singleton {@link DataSet} token backed by a {@link StoreToken}.
 * The token mirrors the store's `model` and `primaryKey` so reflection
 * tools (entity sync, OpenAPI generators, test harnesses) can discover the
 * dataset's shape from the token alone. Disposal of the owning injector
 * tears down the dataset's event subscriptions.
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
      const physicalStore = resolvePhysicalStore<T, TPrimaryKey, TWritableData>(ctx, options.store)
      const dataSet = new DataSet<T, TPrimaryKey, TWritableData>({
        ...options.settings,
        physicalStore,
      })
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
