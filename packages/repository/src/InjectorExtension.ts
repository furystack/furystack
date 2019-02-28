import { DefaultFilter } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { Injector } from '@furystack/inject/dist/Injector'
import { DataSet } from './DataSet'
import { Repository } from './Repository'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/inject/dist/Injector' {
  /**
   * Defines an extended Injector instance
   */
  interface Injector {
    setupRepository: (builder: (repository: Repository) => void) => Injector
    getDataSetFor: <T, TFilter = DefaultFilter<T>>(model: Constructable<T>) => DataSet<T, TFilter>
  }
}

Injector.prototype.setupRepository = function(builder) {
  builder(this.getInstance(Repository))
  return this
}

// tslint:disable-next-line: no-unnecessary-type-annotation
Injector.prototype.getDataSetFor = function<T, TFilter = DefaultFilter<T>>(model: Constructable<T>) {
  return this.getInstance(Repository).getDataSetFor<T, TFilter>(model)
}
