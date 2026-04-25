import type { Constructable, StoreToken } from '@furystack/core'
import { defineStore } from '@furystack/core'
import type { createClient } from 'redis'
import { RedisStore } from './redis-store.js'

/**
 * Options accepted by {@link defineRedisStore}.
 */
export type DefineRedisStoreOptions<T, TPrimaryKey extends keyof T> = {
  /** Human-readable token name used for debug/readability. */
  name: string
  /** Entity model constructor. */
  model: Constructable<T>
  /** Primary key field name. */
  primaryKey: TPrimaryKey
  /**
   * The Redis client. Ownership stays with the caller — the store does not
   * connect or quit it. Multiple stores backed by the same client are fine.
   */
  client: ReturnType<typeof createClient>
}

/**
 * Mints a singleton {@link StoreToken} backed by a {@link RedisStore}.
 *
 * Declare the token once at module scope — calling {@link defineRedisStore}
 * inline every time produces a new token identity per call and defeats
 * singleton caching.
 *
 * @example
 * ```ts
 * const client = createClient({ url: process.env.REDIS_URL })
 * await client.connect()
 *
 * export const UserStore = defineRedisStore({
 *   name: 'my-app/UserStore',
 *   model: User,
 *   primaryKey: 'username',
 *   client,
 * })
 * ```
 */
export const defineRedisStore = <T, const TPrimaryKey extends keyof T>(
  options: DefineRedisStoreOptions<T, TPrimaryKey>,
): StoreToken<T, TPrimaryKey> =>
  defineStore<T, TPrimaryKey>({
    name: options.name,
    model: options.model,
    primaryKey: options.primaryKey,
    factory: () =>
      new RedisStore<T, TPrimaryKey>({
        model: options.model,
        primaryKey: options.primaryKey,
        client: options.client,
      }),
  })
