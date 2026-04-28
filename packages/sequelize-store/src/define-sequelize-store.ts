import type { Constructable, StoreToken } from '@furystack/core'
import { defineStore } from '@furystack/core'
import type { Model, ModelStatic, Options, Sequelize } from 'sequelize'
import { SequelizeClientFactory } from './sequelize-client-factory.js'
import { SequelizeStore } from './sequelize-store.js'

/**
 * Options accepted by {@link defineSequelizeStore}.
 */
export type DefineSequelizeStoreOptions<T extends object, M extends Model<T>, TPrimaryKey extends keyof T> = {
  name: string
  model: Constructable<T>
  sequelizeModel: ModelStatic<M>
  primaryKey: TPrimaryKey
  /** Sequelize client options (dialect, storage, etc.) — also acts as the pool key. */
  options: Options
  /** Runs once per store before the first DB call (e.g. `Model.init(...)` + `sequelize.sync()`). */
  initModel?: (sequelize: Sequelize) => Promise<void>
}

/**
 * Mints a singleton {@link StoreToken} backed by a {@link SequelizeStore}.
 *
 * Internally resolves the singleton {@link SequelizeClientFactory} so every
 * store declared against the same `options` shares one {@link Sequelize}
 * client. Declare the token once at module scope — inline calls mint new
 * identities and defeat singleton caching.
 *
 * @example
 * ```ts
 * export const UserStore = defineSequelizeStore({
 *   name: 'my-app/UserStore',
 *   model: User,
 *   sequelizeModel: UserSequelizeModel,
 *   primaryKey: 'username',
 *   options: { dialect: 'sqlite', storage: './data.sqlite' },
 *   initModel: async (sequelize) => { ... },
 * })
 * ```
 */
export const defineSequelizeStore = <T extends object, M extends Model<T>, const TPrimaryKey extends keyof T>(
  opts: DefineSequelizeStoreOptions<T, M, TPrimaryKey>,
): StoreToken<T, TPrimaryKey> =>
  defineStore<T, TPrimaryKey>({
    name: opts.name,
    model: opts.model,
    primaryKey: opts.primaryKey,
    factory: ({ inject }) => {
      const factory = inject(SequelizeClientFactory)
      return new SequelizeStore<T, M, TPrimaryKey>({
        model: opts.model,
        primaryKey: opts.primaryKey,
        sequelizeModel: opts.sequelizeModel,
        getSequelizeClient: () => factory.getSequelizeClient(opts.options),
        initModel: opts.initModel,
      })
    },
  })
