import type { LeveledLogEntry, LogEntry } from './log-entries.js'
import type { LeveledLogEntryWithoutScope, Logger, LogEntryWithoutScope, ScopedLogger } from './logger.js'

/**
 * Scope used by the default-format logger for its own internal error messages.
 */
export const LoggerScope = '@furystack/logging/Logger'

/**
 * Strategy that persists a leveled log entry to an underlying sink (console,
 * file, remote service, etc.).
 */
export type LoggerBackend = <TData>(entry: LeveledLogEntry<TData>) => Promise<void>

/**
 * Creates a {@link Logger} that delegates persistence to the provided backend.
 *
 * The returned logger handles level convenience methods, scope sugar, and
 * error isolation:
 *
 * - Errors thrown while persisting any entry of severity below `error` are
 *   reported as a new `error` entry on the same logger.
 * - Errors thrown while persisting an `error` entry are escalated to `fatal`.
 * - Errors thrown while persisting a `fatal` entry are written to
 *   `console.error` as a last resort.
 *
 * @param backend - Sink responsible for actually writing an entry.
 */
export const createLogger = (backend: LoggerBackend): Logger => {
  const addEntry = async <T>(entry: LeveledLogEntry<T>): Promise<void> => {
    try {
      await backend(entry)
    } catch (error) {
      if (entry.level === 'fatal') {
        console.error('Failed to persist fatal log entry', { originalEntry: entry, error })
        return
      }
      if (entry.level === 'error') {
        await addEntry({
          level: 'fatal',
          scope: LoggerScope,
          message:
            'There was an error persisting an Error event in the log and therefore the event was elevated to Fatal level.',
          data: { originalEntry: entry, error },
        })
        return
      }
      await addEntry({
        level: 'error',
        scope: LoggerScope,
        message: 'There was an error adding entry to the log',
        data: { entry, error },
      })
    }
  }

  const makeLevel =
    <TLevel extends LeveledLogEntry<unknown>['level']>(level: TLevel) =>
    <T>(entry: LogEntry<T>): Promise<void> =>
      addEntry<T>({ ...entry, level })

  const verbose = makeLevel('verbose')
  const debug = makeLevel('debug')
  const information = makeLevel('information')
  const warning = makeLevel('warning')
  const error = makeLevel('error')
  const fatal = makeLevel('fatal')

  const withScope = (scope: string): ScopedLogger => ({
    addEntry: <T>(entry: LeveledLogEntryWithoutScope<T>) => addEntry<T>({ scope, ...entry }),
    verbose: <T>(entry: LogEntryWithoutScope<T>) => verbose<T>({ scope, ...entry }),
    debug: <T>(entry: LogEntryWithoutScope<T>) => debug<T>({ scope, ...entry }),
    information: <T>(entry: LogEntryWithoutScope<T>) => information<T>({ scope, ...entry }),
    warning: <T>(entry: LogEntryWithoutScope<T>) => warning<T>({ scope, ...entry }),
    error: <T>(entry: LogEntryWithoutScope<T>) => error<T>({ scope, ...entry }),
    fatal: <T>(entry: LogEntryWithoutScope<T>) => fatal<T>({ scope, ...entry }),
  })

  return {
    addEntry,
    verbose,
    debug,
    information,
    warning,
    error,
    fatal,
    withScope,
  }
}
