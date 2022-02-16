import { Constructable } from '@furystack/inject'
import { Injector } from '@furystack/inject/dist/injector'
import { Logger } from './logger'
import { LoggerCollection } from './logger-collection'

declare module '@furystack/inject/dist/injector' {
  /**
   * Defines an extended Injector instance
   */
  export interface Injector {
    /**
     * Registers a Logger service to the injector container with the provided loggers.
     */
    useLogging: (...loggers: Array<Constructable<Logger>>) => this

    /**
     * @deprecated use getLogger()
     * Returns the registered Logger instance
     */
    readonly logger: Logger

    /**
     * Returns the logger instance
     */
    getLogger: () => Logger
  }
}

Injector.prototype.useLogging = function (...loggers) {
  const loggerInstances = loggers.map((l) => this.getInstance(l))
  const collection = this.getInstance(LoggerCollection)
  collection.attachLogger(...loggerInstances)
  this.setExplicitInstance(collection, LoggerCollection)
  return this
}

Injector.prototype.getLogger = function () {
  return this.getInstance(LoggerCollection)
}

Object.defineProperty(Injector.prototype, 'logger', {
  // tslint:disable-next-line: object-literal-shorthand
  get() {
    return this.getInstance(LoggerCollection)
  },
})
