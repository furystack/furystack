import { ILeveledLogEntry, ILogEntry } from './ILogEntries'

/**
 * Log entry without scope variable
 */
export type LogEntryWithoutScope<T> = Exclude<ILogEntry<T>, { scope: string }>

/**
 * Leveled log entry without scope variable
 */
export type LeveledLogEntryWithoutScope<T> = Exclude<ILeveledLogEntry<T>, { scope: string }>

/**
 * A logger instance with predefined scopes
 */
export interface ScopedLogger {
  /**
   * Adds a custom log entry
   */
  addEntry: <T>(entry: LeveledLogEntryWithoutScope<T>) => Promise<void>

  /**
   * Adds a Verbose log entry. Verbose is the noisiest level, rarely (if ever) enabled for a production app.
   */
  verbose: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>

  /**
   * Adds a debug log entry. Debug is used for internal system events that are not necessarily observable from the outside, but useful when determining how something happened.
   */
  debug: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>

  /**
   * Adds an Information log entry. Information events describe things happening in the system that correspond to its responsibilities and functions. Generally these are the observable actions the system can perform.
   */
  information: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>

  /**
   * Adds a Warning log entry. When service is degraded, endangered, or may be behaving outside of its expected parameters, Warning level events are used.
   */
  warning: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>

  /**
   * Adds an Error log entry. When functionality is unavailable or expectations broken, an Error event is used.
   */
  error: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>

  /**
   * Adds a Fatal log entry. The most critical level, Fatal events demand immediate attention.
   */
  fatal: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
}

/**
 * Options type for a Logger instance
 */
export interface ILoggerOptions {
  /**
   * Callback that returns a boolean value that indicates if the current entry should be filtered
   */
  filter: <T>(entry: ILeveledLogEntry<T>) => boolean
}

/**
 * Interface that defines a Logger implementation
 */
export interface ILogger {
  /**
   * Adds a custom log entry
   */
  addEntry: <T>(entry: ILeveledLogEntry<T>) => Promise<void>

  /**
   * Adds a Verbose log entry. Verbose is the noisiest level, rarely (if ever) enabled for a production app.
   */
  verbose: <T>(entry: ILogEntry<T>) => Promise<void>

  /**
   * Adds a debug log entry. Debug is used for internal system events that are not necessarily observable from the outside, but useful when determining how something happened.
   */

  debug: <T>(entry: ILogEntry<T>) => Promise<void>

  /**
   * Adds an Information log entry. Information events describe things happening in the system that correspond to its responsibilities and functions. Generally these are the observable actions the system can perform.
   */
  information: <T>(entry: ILogEntry<T>) => Promise<void>

  /**
   * Adds a Warning log entry. When service is degraded, endangered, or may be behaving outside of its expected parameters, Warning level events are used.
   */
  warning: <T>(entry: ILogEntry<T>) => Promise<void>

  /**
   * Adds an Error log entry. When functionality is unavailable or expectations broken, an Error event is used.
   */
  error: <T>(entry: ILogEntry<T>) => Promise<void>

  /**
   * Adds a Fatal log entry. The most critical level, Fatal events demand immediate attention.
   */
  fatal: <T>(entry: ILogEntry<T>) => Promise<void>

  /**
   * Additional options for the Logger instance
   */
  options: ILoggerOptions

  /**
   * Returns an object that contains shortcuts to the original logger that contains the provided scope.
   * usage example:
   * ````ts
   * const scopedLogger = myLogger.withScope("myLogScope")
   * scopedLogger.information({message: "foo"}) // will add an information entry with the provided scope
   * ````
   */
  withScope: (scope: string) => ScopedLogger
}
