import type { Injector, Token } from '@furystack/inject'
import type { Logger } from './logger.js'
import { LoggerCollection } from './logger-collection.js'

/**
 * Attaches the provided loggers to the application's {@link LoggerCollection}
 * on the given injector.
 * @param injector The target injector
 * @param loggerTokens Tokens of loggers to attach to the collection
 */
export const useLogging = (injector: Injector, ...loggerTokens: Array<Token<Logger>>): void => {
  const collection = injector.get(LoggerCollection)
  collection.attachLogger(...loggerTokens.map((token) => injector.get(token)))
}

/**
 * Returns the singleton {@link LoggerCollection} for the given injector.
 */
export const getLogger = (injector: Injector): LoggerCollection => injector.get(LoggerCollection)
