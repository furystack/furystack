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
  addEntry: <T>(entry: LeveledLogEntryWithoutScope<T>) => Promise<void>
  verbose: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  debug: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  information: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  warning: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  error: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
  fatal: <T>(entry: LogEntryWithoutScope<T>) => Promise<void>
}

/**
 * Options type for a Logger instance
 */
export interface ILoggerOptions {
  filter: <T>(entry: ILeveledLogEntry<T>) => boolean
}

/**
 * Interface that defines a Logger implementation
 */
export interface ILogger {
  addEntry: <T>(entry: ILeveledLogEntry<T>) => Promise<void>
  verbose: <T>(entry: ILogEntry<T>) => Promise<void>
  debug: <T>(entry: ILogEntry<T>) => Promise<void>
  information: <T>(entry: ILogEntry<T>) => Promise<void>
  warning: <T>(entry: ILogEntry<T>) => Promise<void>
  error: <T>(entry: ILogEntry<T>) => Promise<void>
  fatal: <T>(entry: ILogEntry<T>) => Promise<void>
  options: ILoggerOptions
  withScope: (scope: string) => ScopedLogger
}
