import { Constructable } from '@furystack/inject'
import { Injector } from '@furystack/inject/dist/injector'
import { DataSet } from './data-set'
import { Repository } from './repository'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/inject/dist/injector' {
  /**
   * Defines an extended Injector instance
   */
  export interface Injector {
    /**
     * Sets up a Repository on an injector
     * usage example:
     * ````ts
     * injector
     * .useLogging(ConsoleLogger)
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
    getDataSetFor: <T>(model: Constructable<T> | string) => DataSet<T>
  }
}

Injector.prototype.setupRepository = function (builder) {
  builder(this.getInstance(Repository))
  return this
}

// tslint:disable-next-line: no-unnecessary-type-annotation
Injector.prototype.getDataSetFor = function <T>(model: Constructable<T> | string) {
  return this.getInstance(Repository).getDataSetFor<T>(model)
}
