import { addStore } from '@furystack/core'
import type { Constructable, Injector } from '@furystack/inject'
import type { Options, Sequelize, ModelStatic, Model } from 'sequelize'
import { SequelizeClientFactory } from './sequelize-client-factory'
import { SequelizeStore } from './sequelize-store'

export const useSequelize = function <T extends object, M extends ModelStatic<Model<T>>, Key extends keyof T>({
  injector,
  model,
  sequelizeModel,
  primaryKey,
  options,
  initModel,
}: {
  injector: Injector
  /**
   * The constructable model class
   */
  model: Constructable<T>

  /**
   * The Sequelize Model class
   */
  sequelizeModel: M

  /**
   * The name of the Primary Key property
   */
  primaryKey: Key
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
    sequelizeModel,
  })
  addStore(injector, store)
}
