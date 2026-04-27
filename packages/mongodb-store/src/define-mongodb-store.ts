import type { Constructable, StoreToken } from '@furystack/core'
import { defineStore } from '@furystack/core'
import type { MongoClient, MongoClientOptions } from 'mongodb'
import { MongoClientFactory } from './mongo-client-factory.js'
import { MongodbStore } from './mongodb-store.js'

/**
 * Options accepted by {@link defineMongoDbStore}.
 */
export type DefineMongoDbStoreOptions<T extends object, TPrimaryKey extends keyof T> = {
  /** Human-readable token name used for debug/readability. */
  name: string
  /** Entity model constructor. */
  model: Constructable<T>
  /** Primary key field name. */
  primaryKey: TPrimaryKey
  /** MongoDB deployment URL (e.g. `mongodb://localhost:27017`). */
  url: string
  /** MongoDB database name. */
  db: string
  /** MongoDB collection name. */
  collection: string
  /** Optional {@link MongoClientOptions}. */
  options?: MongoClientOptions
}

/**
 * Mints a singleton {@link StoreToken} backed by a {@link MongodbStore}.
 *
 * Internally resolves the singleton {@link MongoClientFactory} so every store
 * declared against the same `url` shares one {@link MongoClient}. Declare the
 * token once at module scope — inline calls mint new identities and defeat
 * singleton caching.
 *
 * @example
 * ```ts
 * export const UserStore = defineMongoDbStore({
 *   name: 'my-app/UserStore',
 *   model: User,
 *   primaryKey: 'username',
 *   url: 'mongodb://localhost:27017',
 *   db: 'my-app',
 *   collection: 'users',
 * })
 * ```
 */
export const defineMongoDbStore = <T extends object, const TPrimaryKey extends keyof T>(
  options: DefineMongoDbStoreOptions<T, TPrimaryKey>,
): StoreToken<T, TPrimaryKey> =>
  defineStore<T, TPrimaryKey>({
    name: options.name,
    model: options.model,
    primaryKey: options.primaryKey,
    factory: ({ inject }) => {
      const factory = inject(MongoClientFactory)
      return new MongodbStore<T, TPrimaryKey>({
        model: options.model,
        primaryKey: options.primaryKey,
        db: options.db,
        collection: options.collection,
        mongoClient: () => factory.getClientFor(options.url, options.options),
      })
    },
  })
