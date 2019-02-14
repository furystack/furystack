import { ILeveledLogEntry, ILogEntry, LogLevel } from '../Models/ILogEntries'
import { ILogger, ILoggerOptions } from '../Models/ILogger'

/**
 * Default scope key for the Abstract Logger
 */
export const AbstractLoggerScope = '@furystack/core/AbstractLogger'

/**
 * default options for a logger instance
 */
export const defaultLoggerOptions: ILoggerOptions = {
  filter: () => true,
}

/**
 * Abstract logger instance
 */
export abstract class AbstractLogger<TOptions extends ILoggerOptions = ILoggerOptions> implements ILogger {
  public readonly options: TOptions
  constructor(options?: Partial<ILoggerOptions>) {
    this.options = {
      ...defaultLoggerOptions,
      ...options,
    } as TOptions
  }

  public abstract addEntry<T>(entry: ILeveledLogEntry<T>): Promise<void>
  private async addEntryInternal<T>(entry: ILeveledLogEntry<T>) {
    if (!this.options.filter(entry)) {
      return
    }
    try {
      await this.addEntry(entry)
    } catch (error) {
      this.error({
        scope: AbstractLoggerScope,
        message: 'There was an error adding entry to the log',
        data: {
          entry,
          error,
        },
      })
    }
  }
  public async verbose<T>(entry: ILogEntry<T>) {
    await this.addEntryInternal({
      ...entry,
      level: LogLevel.Verbose,
    })
  }
  public async debug<T>(entry: ILogEntry<T>) {
    await this.addEntryInternal({
      ...entry,
      level: LogLevel.Debug,
    })
  }
  public async information<T>(entry: ILogEntry<T>) {
    await this.addEntryInternal({
      ...entry,
      level: LogLevel.Information,
    })
  }
  public async warning<T>(entry: ILogEntry<T>) {
    await this.addEntryInternal({
      ...entry,
      level: LogLevel.Warning,
    })
  }
  public async error<T>(entry: ILogEntry<T>) {
    try {
      await this.addEntry({
        ...entry,
        level: LogLevel.Error,
      })
    } catch (error) {
      await this.fatal({
        scope: AbstractLoggerScope,
        message:
          'There was an error persisting an Error event in the log and therefore the event was elevated to Fatal level.',
        data: {
          originalEntry: entry,
          error,
        },
      })
    }
  }
  public async fatal<T>(entry: ILogEntry<T>) {
    await this.addEntry({
      ...entry,
      level: LogLevel.Fatal,
    })
  }
}
