import { addStore } from '@furystack/core'
import { Constructable, Injector } from '@furystack/inject'
import { MongoClientOptions } from 'mongodb'
import { MongoClientFactory } from './mongo-client-factory'
import { MongodbStore } from './mongodb-store'

export const useMongoDb = <T extends object>({
  injector,
  model,
  primaryKey,
  db,
  collection,
  url,
  options,
}: {
  /**
   * The Injector instance to use
   */
  injector: Injector
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
}) => {
  const clientFactory = injector.getInstance(MongoClientFactory)
  const store = new MongodbStore({
    model,
    primaryKey,
    db,
    collection,
    mongoClient: async () => await clientFactory.getClientFor(url, options),
  })
  addStore(injector, store)
}
