import { Constructable } from '@furystack/inject'
import { Injector } from '@furystack/inject/dist/cjs/injector'
import { DataSet } from './data-set'
import { Repository } from './repository'

declare module '@furystack/inject/dist/cjs/injector' {
  /**
   * Defines an extended Injector instance
   */
  export interface Injector {
    /**
     * Sets up a Repository on an injector
     * usage example:
     * ````ts
     * injector
     * .setupStores(sm => {
     *   sm.useMongoDb(TestEntry, 'mongodb://localhost:27017', 'test', 'TestEntries')
     *     .useMongoDb(User, 'mongodb://localhost:27017', 'test', 'users')
     * })
     * .setupRepository(repo => {
     *   repo.createDataSet(User, { name: 'users', onEntityAdded: (ev) => console.log('New user added', ev.entity) })
     * })
     *
     * const userDataSet = injector.getDataSetFor(User)
     * ````
     */
    setupRepository: (builder: (repository: Repository) => void) => this
    /**
     * Returns a DataSet for a specific model
     */
    getDataSetFor: <T, TPrimaryKey extends keyof T>(
      model: Constructable<T>,
      primaryKey: TPrimaryKey,
    ) => DataSet<T, TPrimaryKey>
  }
}

Injector.prototype.setupRepository = function (builder) {
  builder(this.getInstance(Repository))
  return this
}

Injector.prototype.getDataSetFor = function (model, primaryKey) {
  return this.getInstance(Repository).getDataSetFor(model, primaryKey)
}
