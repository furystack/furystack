import { Constructable } from '@furystack/inject'
import { Injector } from '@furystack/inject'
import { Logger } from './logger'
import { LoggerCollection } from './logger-collection'

export const useLogging = (injector: Injector, ...loggers: Array<Constructable<Logger>>) => {
  const loggerInstances = loggers.map((l) => injector.getInstance(l))
  const collection = injector.getInstance(LoggerCollection)
  collection.attachLogger(...loggerInstances)
  injector.setExplicitInstance(collection, LoggerCollection)
  return this
}

export const getLogger = (i: Injector) => i.getInstance(LoggerCollection)
