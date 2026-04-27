/**
 * The verbosity level of a log entry
 */
export type LogLevel =
  /**
   * Verbose is the noisiest level, rarely (if ever) enabled for a production app.
   */
  | 'verbose'
  /**
   * Debug is used for internal system events that are not necessarily observable from the outside, but useful when determining how something happened.
   */
  | 'debug'

  /**
   * Information events describe things happening in the system that correspond to its responsibilities and functions. Generally these are the observable actions the system can perform.
   */
  | 'information'

  /**
   * When service is degraded, endangered, or may be behaving outside of its expected parameters, Warning level events are used.
   */
  | 'warning'

  /**
   * When functionality is unavailable or expectations broken, an Error event is used.
   */
  | 'error'

  /**
   * The most critical level, Fatal events demand immediate attention.
   */
  | 'fatal'

/** A log entry without a level — fed to per-level convenience methods. */
export interface LogEntry<TData> {
  /** Grouping key for entries (component or service name). */
  scope: string
  message: string
  data?: TData
}

/** A log entry tagged with its {@link LogLevel}. */
export interface LeveledLogEntry<T> extends LogEntry<T> {
  level: LogLevel
}
