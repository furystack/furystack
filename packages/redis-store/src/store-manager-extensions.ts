import { StoreManager } from '@furystack/core/dist/cjs/store-manager'
import { Constructable } from '@furystack/inject'
import { createClient } from 'redis'
import { RedisStore } from './redis-store'

declare module '@furystack/core/dist/cjs/store-manager' {
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
    useRedis: <T>(model: Constructable<T>, primaryKey: keyof T, client: ReturnType<typeof createClient>) => this
  }
}

StoreManager.prototype.useRedis = function (model, primaryKey, client) {
  const store = new RedisStore({ model, client, primaryKey })
  this.addStore(store)
  return this
}
