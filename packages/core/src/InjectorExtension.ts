import { Constructable } from '@furystack/inject'
import { Injector } from '@furystack/inject/dist/Injector'
import { LoggerCollection } from './Loggers'
import { ILogger } from './Models/ILogger'
import { StoreManager } from './StoreManager'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/inject/dist/Injector' {
  /**
   * Defines an extended Injector instance
   */
  interface Injector {
    useLogging: (...loggers: Array<Constructable<ILogger>>) => Injector
    setupStores: (builder: (storeManager: StoreManager) => void) => Injector
    readonly logger: ILogger
  }
}

Injector.prototype.useLogging = function(...loggers) {
  const loggerInstances = loggers.map(l => this.getInstance(l))
  const collection = new LoggerCollection()
  collection.attachLogger(...loggerInstances)
  this.setExplicitInstance(collection, LoggerCollection)
  return this
}

// tslint:disable-next-line: no-unnecessary-type-annotation
Injector.prototype.setupStores = function(builder) {
  builder(this.getInstance(StoreManager))
  return this
}

Object.defineProperty(Injector.prototype, 'logger', {
  // tslint:disable-next-line: object-literal-shorthand
  get: function() {
    return this.getInstance(LoggerCollection)
  },
})
