import type { LeveledLogEntry, LogEntry, LogLevel } from './log-entries.js'

export type LogEntryWithoutScope<T> = Omit<LogEntry<T>, 'scope'>

export type LeveledLogEntryWithoutScope<T> = Omit<LeveledLogEntry<T>, 'scope'>

/**
 * Logger surface with the `scope` field pre-bound. Returned by
 * {@link Logger.withScope}; entries written through this surface inherit
 * the bound scope automatically.
 */
export interface ScopedLogger {
  addEntry: <T>(entry: LeveledLogEntryWithoutScope<T>) => Promise<void>
  verbose: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  debug: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  information: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  warning: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  error: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  fatal: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
}

/**
 * Application logging surface. Per-level convenience methods delegate to
 * `addEntry` with the corresponding {@link LogLevel}; see `LogLevel` for
 * the canonical level meanings.
 */
export interface Logger {
  addEntry: <T>(entry: LeveledLogEntry<T>) => Promise<void>
  verbose: <T>(entry: LogEntry<T>) => Promise<void>
  debug: <T>(entry: LogEntry<T>) => Promise<void>
  information: <T>(entry: LogEntry<T>) => Promise<void>
  warning: <T>(entry: LogEntry<T>) => Promise<void>
  error: <T>(entry: LogEntry<T>) => Promise<void>
  fatal: <T>(entry: LogEntry<T>) => Promise<void>

  /**
   * Returns a {@link ScopedLogger} that pre-binds `scope` on every entry.
   *
   * @example
   * ```ts
   * const scoped = myLogger.withScope('my-app/AuthService')
   * scoped.information({ message: 'Service online' })
   * ```
   */
  withScope: (scope: string) => ScopedLogger
}
