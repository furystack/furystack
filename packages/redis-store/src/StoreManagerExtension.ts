import { StoreManager } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { RedisClient } from 'redis'
import { RedisStore } from './RedisStore'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/core/dist/StoreManager' {
  /**
   * Defines an extended Injector instance
   */
  interface StoreManager {
    useRedis: <T>(model: Constructable<T>, client: RedisClient) => StoreManager
  }
}

StoreManager.prototype.useRedis = function(model, client) {
  const store = new RedisStore({ model, client, logger: this.injector.logger })
  this.addStore(store)
  return this
}
