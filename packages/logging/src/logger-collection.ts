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
  /** Attaches one or more loggers to the collection. */
  attachLogger: (...loggers: Logger[]) => void
  /** Removes a logger from the collection. */
  detach: (logger: Logger) => void
  /** Snapshot of currently attached loggers. */
  getLoggers: () => readonly Logger[]
}

export const LoggerCollection: Token<LoggerCollection, 'singleton'> = defineService({
  name: 'furystack/logging/LoggerCollection',
  lifetime: 'singleton',
  factory: () => {
    let loggers: Logger[] = []
    const base = createLogger(async (entry) => {
      await Promise.all(loggers.map((logger) => logger.addEntry(entry)))
    })
    return {
      ...base,
      attachLogger: (...toAttach: Logger[]) => {
        loggers.push(...toAttach)
      },
      detach: (logger: Logger) => {
        loggers = loggers.filter((candidate) => candidate !== logger)
      },
      getLoggers: () => loggers,
    }
  },
})
