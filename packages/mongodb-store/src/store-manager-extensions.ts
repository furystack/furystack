import { StoreManager } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { MongoClientOptions } from 'mongodb'
import { MongoClientFactory } from './mongo-client-factory'
import { MongodbStore } from './mongodb-store'

declare module '@furystack/core/dist/store-manager' {
  /**
   * Defines an extended Injector instance
   */
  interface StoreManager {
    /**
     * Registers a MongoDb store to the StoreManager instance with the provided model.
     */
    useMongoDb: <T extends { _id: string }>(options: {
      /**
       * The constructable model class
       */
      model: Constructable<T>
      /**
       * Url of the MongoDb repository
       */
      url: string
      /**
       * MongoDb Database name
       */
      db: string
      /**
       * MongoDb Collection name
       */
      collection: string

      /**
       * Optional options for the MongoDb Client
       */
      options?: MongoClientOptions
    }) => StoreManager
  }
}

StoreManager.prototype.useMongoDb = function({ model, db, collection, url, options }) {
  const clientFactory = this.injector.getInstance(MongoClientFactory)
  const store = new MongodbStore({
    model,
    db,
    collection,
    logger: this.injector.logger,
    mongoClient: async () => await clientFactory.getClientFor(url, options),
  })
  this.addStore(store)
  return this
}
