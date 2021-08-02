import { StoreManager } from '@furystack/core/dist/cjs/store-manager'
import { Options, ModelCtor, Model, Sequelize } from 'sequelize'
import { SequelizeClientFactory } from './sequelize-client-factory'
import { SequelizeStore } from './sequelize-store'

declare module '@furystack/core/dist/cjs/store-manager' {
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

      initModel?: (sequelize: Sequelize) => Promise<void>
    }) => this
  }
}

StoreManager.prototype.useSequelize = function ({ model, primaryKey, options, initModel }) {
  const clientFactory = this.injector.getInstance(SequelizeClientFactory)
  const store = new SequelizeStore({
    model,
    primaryKey,
    getSequelizeClient: async () => await clientFactory.getSequelizeClient(options),
    initModel,
  })
  this.addStore(store)
  return this
}
