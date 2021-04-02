import { StoreManager } from '@furystack/core/dist/store-manager'
import { Options, ModelCtor, Model } from 'sequelize'
import { SequelizeClientFactory } from './sequelize-client-factory'
import { SequelizeStore } from './sequelize-store'

declare module '@furystack/core/dist/store-manager' {
  /**
   * Defines an extended Injector instance
   */
  interface StoreManager {
    /**
     * Registers a MongoDb store to the StoreManager instance with the provided model.
     */
    useSequelize: <T extends Model>(options: {
      /**
       * The constructable model class
       */
      model: ModelCtor<T>
      /**
       * The name of the Primary Key property
       */
      primaryKey: keyof T
      /**
       * Optional options for the MongoDb Client
       */
      options: Options
    }) => this
  }
}

StoreManager.prototype.useSequelize = function ({ model, primaryKey, db, collection, url, options }) {
  const clientFactory = this.injector.getInstance(SequelizeClientFactory)
  const store = new SequelizeStore({
    model,
    primaryKey,
    db,
    collection,
    mongoClient: async () => await clientFactory.getClientFor(options),
  })
  this.addStore(store)
  return this
}
