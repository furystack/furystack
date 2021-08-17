import { StoreManager } from '@furystack/core/dist/esm/store-manager'
import { Constructable } from '@furystack/inject'
import { MongoClientOptions } from 'mongodb'
import { MongoClientFactory } from './mongo-client-factory'
import { MongodbStore } from './mongodb-store'

declare module '@furystack/core/dist/esm/store-manager' {
  /**
   * Defines an extended Injector instance
   */
  interface StoreManager {
    /**
     * Registers a MongoDb store to the StoreManager instance with the provided model.
     */
    useMongoDb: <T>(options: {
      /**
       * The constructable model class
       */
      model: Constructable<T>
      /**
       * The name of the Primary Key property
       */
      primaryKey: keyof T
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
    }) => this
  }
}

StoreManager.prototype.useMongoDb = function ({ model, primaryKey, db, collection, url, options }) {
  const clientFactory = this.injector.getInstance(MongoClientFactory)
  const store = new MongodbStore({
    model,
    primaryKey,
    db,
    collection,
    mongoClient: async () => await clientFactory.getClientFor(url, options),
  })
  this.addStore(store)
  return this
}
