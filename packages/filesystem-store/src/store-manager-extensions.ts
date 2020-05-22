import { StoreManager } from '@furystack/core/dist/store-manager'
import { Constructable } from '@furystack/inject'
import { FileSystemStore } from './filesystem-store'

declare module '@furystack/core/dist/store-manager' {
  /**
   * Defines an extended Injector instance
   */
  interface StoreManager {
    /**
     * Registers a filesystem-store for the provided model in the StoreManager
     * usage example:
     * ````ts
     * import '@furystack/filesystem-store'
     *
     * defaultInjector
     *    .useLogging(ConsoleLogger)
     *    .useFileSystem(sm => sm.useFileSystem({model: MyModel, primaryKey: 'myId', fileName: 'asd.json')
     * ````
     */
    useFileSystem: <T>(options: {
      model: Constructable<T>
      primaryKey: keyof T
      fileName: string
      tickMs?: number
    }) => this
  }
}

StoreManager.prototype.useFileSystem = function (options) {
  const { logger } = this.injector
  const store = new FileSystemStore({ ...options, logger })
  this.addStore(store)
  return this
}
