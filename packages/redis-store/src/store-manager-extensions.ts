import { StoreManager } from '@furystack/core/dist/store-manager'
import { Constructable } from '@furystack/inject'
import { RedisClient } from 'redis'
import { RedisStore } from './redis-store'

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
     *    .setupStores(sm => sm.useRedis(SessionModel, 'sessionId', createClient())
     * ````
     */
    useRedis: <T>(model: Constructable<T>, primaryKey: keyof T, client: RedisClient) => this
  }
}

StoreManager.prototype.useRedis = function (model, primaryKey, client) {
  const store = new RedisStore({ model, client, primaryKey })
  this.addStore(store)
  return this
}
