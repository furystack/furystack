import { StoreManager } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { ConnectionManager } from 'typeorm'
import { TypeOrmStore } from './TypeOrmStore'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/core/dist/store-manager' {
  /**
   * Defines an extended Injector instance
   */
  interface StoreManager {
    /**
     * Sets up a TypeOrm store for a specified model.
     * Usage example:
     * ````ts
     * defaultInjector
     *  .useLogging(ConsoleLogger)
     *  .useTypeOrm({
     *    type: 'sqlite',
     *    database: 'data.sqlite',
     *    entities: [User]
     *  })
     *  .setupStores(sm =>
     *    sm.useTypeOrmStore(User))
     * ````
     */
    useTypeOrmStore: <T>(model: Constructable<T>, connectionName?: string) => StoreManager
  }
}

StoreManager.prototype.useTypeOrmStore = function(model, connectionName) {
  const connection = this.injector.getInstance(ConnectionManager).get(connectionName)
  const store = new TypeOrmStore({ model, connection, logger: this.injector.logger })
  this.addStore(store)
  return this
}
