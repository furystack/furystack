import { Injector } from '@furystack/inject/dist/Injector'
import { ILogger } from './models/ILogger'

// tslint:disable-next-line: no-unused-expression
declare module '@furystack/inject/dist/Injector' {
  /**
   * Defines an extended Injector instance
   */
  interface Injector {
    useLogging: (logger: ILogger) => Injector
  }
}

Injector.prototype.useLogging = function(logger) {
  this.setExplicitInstance(logger)
  return this
}
