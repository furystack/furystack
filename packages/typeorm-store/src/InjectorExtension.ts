import { Injector } from '@furystack/inject/dist/Injector'
import Semaphore from 'semaphore-async-await'
import { Connection, ConnectionManager } from 'typeorm'
import { ConnectionOptions } from 'typeorm/connection/ConnectionOptions'

declare module '@furystack/inject/dist/Injector' {
  /**
   * Extended Injector type with TypeOrm methods
   */
  export interface Injector {
    useTypeOrm: (connectionOptions: ConnectionOptions) => Injector
  }
}

declare module 'typeorm/connection/Connection' {
  interface Connection {
    awaitConnection(): Promise<Connection>
  }
}

const lock = new Semaphore(1)

Connection.prototype.awaitConnection = async function() {
  await lock.acquire()
  lock.release()
  return this
}

Injector.prototype.useTypeOrm = function(options) {
  this.logger.verbose({
    scope: '@furystack/typeorm-store/useTypeOrm',
    message: `Setting up TypeOrm${options.name ? ' for connection ' + options.name : ''}...`,
    data: options,
  })
  let cm!: ConnectionManager
  // tslint:disable-next-line: no-string-literal
  if (!this['cachedSingletons'].has(ConnectionManager)) {
    cm = new ConnectionManager()
    this.setExplicitInstance(cm)
  } else {
    cm = this.getInstance(ConnectionManager)
  }
  const connection = cm.create(options)
  lock.acquire()
  connection
    .connect()
    .then(() => {
      this.logger.verbose({
        scope: '@furystack/typeorm-store/useTypeOrm',
        message: `Connection estabilished to DB${options.name ? ' for connection ' + options.name : ''}...`,
      })
    })
    .catch(e => {
      this.logger.fatal({
        data: { error: e, options },
        message: `Error while connection to the database${options.name ? ' for connection ' + options.name : ''}...`,
        scope: '@furystack/typeorm-store/useTypeOrm',
      })
    })
    .finally(() => lock.release())
  return this
}
