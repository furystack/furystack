import { defineService } from '@furystack/inject'
import type { Token } from '@furystack/inject'
import { createLogger } from './create-logger.js'
import type { Logger } from './logger.js'

/**
 * A {@link Logger} that forwards every entry to a mutable set of attached
 * loggers. Use this as the application-wide logging entry point and compose
 * concrete sinks (console, file, etc.) via {@link LoggerCollection.attachLogger}.
 */
export type LoggerCollection = Logger & {
  /**
   * Attaches one or more loggers to the collection. Attach is idempotent:
   * re-attaching an already-registered logger is a no-op and does not cause
   * duplicate fan-out.
   */
  attachLogger: (...loggers: Logger[]) => void
  /** Removes a logger from the collection. */
  detach: (logger: Logger) => void
  /** Snapshot copy of currently attached loggers. Safe to mutate. */
  getLoggers: () => readonly Logger[]
}

export const LoggerCollection: Token<LoggerCollection, 'singleton'> = defineService({
  name: 'furystack/logging/LoggerCollection',
  lifetime: 'singleton',
  factory: () => {
    const loggers = new Set<Logger>()
    const base = createLogger(async (entry) => {
      await Promise.all(Array.from(loggers).map((logger) => logger.addEntry(entry)))
    })
    return {
      ...base,
      attachLogger: (...toAttach: Logger[]) => {
        for (const logger of toAttach) {
          loggers.add(logger)
        }
      },
      detach: (logger: Logger) => {
        loggers.delete(logger)
      },
      getLoggers: () => Array.from(loggers),
    }
  },
})
