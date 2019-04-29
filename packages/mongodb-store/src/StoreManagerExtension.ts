import { StoreManager } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { MongoClientFactory } from './MongoClientFactory'
import { MongodbStore } from './MongodbStore'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/core/dist/StoreManager' {
  /**
   * Defines an extended Injector instance
   */
  interface StoreManager {
    useMongoDb: <T extends { _id: string }>(
      model: Constructable<T>,
      url: string,
      db: string,
      collection: string,
    ) => StoreManager
  }
}

StoreManager.prototype.useMongoDb = function(model, url, db, collection) {
  const clientFactory = this.injector.getInstance(MongoClientFactory)
  const store = new MongodbStore({
    model,
    db,
    collection,
    logger: this.injector.logger,
    mongoClient: async () => await clientFactory.getClientFor(url),
  })
  this.addStore(store)
  return this
}
