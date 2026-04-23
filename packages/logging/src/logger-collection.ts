import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import { createLogger } from './create-logger.js'
import type { Logger } from './logger.js'

/**
 * Configuration surface for the application's {@link LoggerCollection}.
 *
 * Holds the frozen list of attached loggers. Composition happens at setup time
 * via {@link useLogging} (which rebinds this token and invalidates the derived
 * {@link LoggerCollection} cache), not through runtime mutation.
 *
 * Default: empty list. Resolving {@link LoggerCollection} without configuring
 * the registry yields a valid logger that discards every entry.
 */
export type LoggerRegistry = {
  readonly loggers: readonly Logger[]
}

export const LoggerRegistry: Token<LoggerRegistry, 'singleton'> = defineService({
  name: 'furystack/logging/LoggerRegistry',
  lifetime: 'singleton',
  factory: () => ({ loggers: [] }),
})

/**
 * Application-wide {@link Logger} that fans every entry out to the loggers
 * declared in the {@link LoggerRegistry}. Pure DI composition — the set of
 * targets is fixed at construction and cannot be mutated after resolve.
 *
 * To change the attached loggers at runtime, call {@link useLogging} again;
 * the registry is rebound and this collection's cached instance is dropped so
 * the next resolution rebuilds against the new registry.
 */
export const LoggerCollection: Token<Logger, 'singleton'> = defineService({
  name: 'furystack/logging/LoggerCollection',
  lifetime: 'singleton',
  factory: ({ inject }) => {
    const { loggers } = inject(LoggerRegistry)
    return createLogger(async (entry) => {
      await Promise.all(loggers.map((logger) => logger.addEntry(entry)))
    })
  },
})
