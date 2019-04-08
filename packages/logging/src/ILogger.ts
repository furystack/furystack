import { ILeveledLogEntry, ILogEntry } from './ILogEntries'

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
}
