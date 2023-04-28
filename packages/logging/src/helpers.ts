import type { Constructable } from '@furystack/inject'
import type { Injector } from '@furystack/inject'
import type { Logger } from './logger.js'
import { LoggerCollection } from './logger-collection.js'

/**
 * Registers a Logger service to the injector container with the provided loggers.
 * @param injector The Injector instance
 * @param {...any} loggers A list of loggers
 */
export const useLogging = (injector: Injector, ...loggers: Array<Constructable<Logger>>) => {
  const loggerInstances = loggers.map((l) => injector.getInstance(l))
  const collection = injector.getInstance(LoggerCollection)
  collection.attachLogger(...loggerInstances)
  injector.setExplicitInstance(collection, LoggerCollection)
}

/**
 * @param injector The Injector instance
 * @returns A Logger Collection instance that can be used to broadcast log messages
 */
export const getLogger = (injector: Injector) => injector.getInstance(LoggerCollection)
