import { isToken } from '@furystack/inject'
import type { Injector, ServiceContext, Token } from '@furystack/inject'
import type { Logger, ScopedLogger } from './logger.js'
import { LoggerCollection, LoggerRegistry } from './logger-collection.js'

/**
 * Entry accepted by {@link useLogging}. Either a pre-resolved {@link Logger}
 * instance (handy for tests and ad-hoc logging sinks) or a {@link Token} that
 * resolves to a `Logger` through the injector.
 */
export type LoggerEntry = Logger | Token<Logger, 'singleton'>

/**
 * Configures the application's logging composition on the given injector.
 *
 * Rebinds the {@link LoggerRegistry} with the requested loggers and invalidates
 * any previously-resolved {@link LoggerCollection} so subsequent resolutions
 * fan out to the new set. Each call replaces the previous registration
 * — this is configuration, not accumulation.
 *
 * **Note:** because {@link LoggerRegistry} is a singleton token, `useLogging`
 * always rebinds at the **root** injector, regardless of which injector you
 * pass in. Calling it on a child scope still replaces the application-wide
 * logging composition. Pass the root injector for clarity.
 *
 * @example
 * ```ts
 * useLogging(injector, ConsoleLogger, FileLogger)
 * ```
 */
export const useLogging = (injector: Injector, ...loggers: LoggerEntry[]): void => {
  injector.bind(LoggerRegistry, ({ inject }) => ({
    loggers: loggers.map((entry) => (isToken<Logger>(entry) ? inject(entry) : entry)),
  }))
  injector.invalidate(LoggerCollection)
}

/**
 * Returns the singleton {@link LoggerCollection} for the given injector.
 */
export const getLogger = (injector: Injector): Logger => injector.get(LoggerCollection)

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
