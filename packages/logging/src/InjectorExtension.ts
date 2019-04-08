import { Constructable } from '@furystack/inject'
import { Injector } from '@furystack/inject/dist/Injector'
import { ILogger } from './ILogger'
import { LoggerCollection } from './LoggerCollection'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/inject/dist/Injector' {
  /**
   * Defines an extended Injector instance
   */
  interface Injector {
    useLogging: (...loggers: Array<Constructable<ILogger>>) => Injector
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

Object.defineProperty(Injector.prototype, 'logger', {
  // tslint:disable-next-line: object-literal-shorthand
  get: function() {
    return this.getInstance(LoggerCollection)
  },
})
