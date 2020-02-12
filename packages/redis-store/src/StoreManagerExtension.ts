import { StoreManager } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { RedisClient } from 'redis'
import { RedisStore } from './RedisStore'

declare module '@furystack/core/dist/store-manager' {
  /**
   * Defines an extended Injector instance
   */
  interface StoreManager {
    /**
     * Registers a Redis-store for the provided model in the StoreManager
     * usage example:
     * ````ts
     * import { createClient } from 'redis'
     * import '@furystack/redis-store'
     *
     * defaultInjector
     *    .useLogging(ConsoleLogger)
     *    .setupStores(sm => sm.useRedis(SessionModel, 'sessionId', createClient())
     * ````
     */
    useRedis: <T>(model: Constructable<T>, primaryKey: keyof T, client: RedisClient) => StoreManager
  }
}

StoreManager.prototype.useRedis = function(model, primaryKey, client) {
  const store = new RedisStore({ model, client, primaryKey, logger: this.injector.logger })
  this.addStore(store)
  return this
}
