import { addStore } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { Options, Model, Sequelize, ModelStatic } from 'sequelize'
import { SequelizeClientFactory } from './sequelize-client-factory.js'
import { SequelizeStore } from './sequelize-store.js'

export const useSequelize = function <T extends Model>({
  injector,
  model,
  primaryKey,
  options,
  initModel,
}: {
  injector: Injector
  /**
   * The constructable model class
   */
  model: ModelStatic<T>
  /**
   * The name of the Primary Key property
   */
  primaryKey: keyof T
  /**
   * Optional options for the MongoDb Client
   */
  options: Options
  /**
   * A callback for model initialization
   */

  initModel?: (sequelize: Sequelize) => Promise<void>
}) {
  const clientFactory = injector.getInstance(SequelizeClientFactory)
  const store = new SequelizeStore({
    model,
    primaryKey,
    getSequelizeClient: () => clientFactory.getSequelizeClient(options),
    initModel,
  })
  addStore(injector, store)
}
