import { StoreManager } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { ConnectionManager } from 'typeorm'
import { TypeOrmStore } from './TypeOrmStore'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/core/dist/StoreManager' {
  /**
   * Defines an extended Injector instance
   */
  interface StoreManager {
    useTypeOrmStore: <T>(model: Constructable<T>, connectionName?: string) => StoreManager
  }
}

StoreManager.prototype.useTypeOrmStore = function(model, connectionName) {
  const connection = this.injector.getInstance(ConnectionManager).get(connectionName)
  const store = new TypeOrmStore(model, connection, this.injector.logger)
  this.addStore(model, store)
  return this
}
