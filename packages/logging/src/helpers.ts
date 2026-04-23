import type { Injector, ServiceContext, Token } from '@furystack/inject'
import type { Logger, ScopedLogger } from './logger.js'
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

/**
 * Returns a {@link ScopedLogger} whose scope is the name of the service being
 * instantiated. Intended to be called from inside a `defineService` factory so
 * that every log entry carries the service's own name automatically.
 *
 * @example
 * ```ts
 * const AuthService = defineService({
 *   name: '@furystack/auth/AuthService',
 *   lifetime: 'singleton',
 *   factory: (ctx) => {
 *     const log = useScopedLogger(ctx)
 *     log.information({ message: 'Service online' })
 *     return { ... }
 *   },
 * })
 * ```
 */
export const useScopedLogger = (ctx: ServiceContext): ScopedLogger =>
  ctx.inject(LoggerCollection).withScope(ctx.token.name)
