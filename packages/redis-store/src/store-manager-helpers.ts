import { addStore } from '@furystack/core'
import type { Constructable, Injector } from '@furystack/inject'
import type { createClient } from 'redis'
import { RedisStore } from './redis-store.js'

/**
 * Registers a Redis store for the provided model
 * @param options The options for store creation
 * @param options.injector The injector to use
 * @param options.model The model to register the store for
 * @param options.primaryKey The name of the primary key property
 * @param options.client The redis client to use
 */
export const useRedis = <T>(options: {
  injector: Injector
  model: Constructable<T>
  primaryKey: keyof T
  client: ReturnType<typeof createClient>
}) => {
  const { model, client, primaryKey, injector } = options
  const store = new RedisStore({ model, client, primaryKey })
  addStore(injector, store)
}
