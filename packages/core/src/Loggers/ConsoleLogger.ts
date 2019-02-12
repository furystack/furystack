import { ILoggerOptions } from '../Models'
import { ILeveledLogEntry, LogLevel } from '../Models/ILogEntries'
import { AbstractLogger, defaultLoggerOptions } from './AbstractLogger'

/**
 * Resets the console color
 */
export const Reset = '\x1b[0m'

/**
 * Black console foreground color
 */
export const FgBlack = '\x1b[30m'

/**
 * Red console foreground color
 */
export const FgRed = '\x1b[31m'

/**
 * Green console foreground color
 */
export const FgGreen = '\x1b[32m'
/**
 * Yellow console foreground color
 */
export const FgYellow = '\x1b[33m'
/**
 * Blue console foreground color
 */
export const FgBlue = '\x1b[34m'
/**
 * Magentaa console foreground color
 */
export const FgMagenta = '\x1b[35m'
/**
 * Cyan console foreground color
 */
export const FgCyan = '\x1b[36m'
/**
 * White console foreground color
 */
export const FgWhite = '\x1b[37m'

/**
 * Returns an associated color to a specific log level
 * @param level the log level
 */
export const getLevelColor = (level: LogLevel) => {
  switch (level) {
    case LogLevel.Verbose:
    case LogLevel.Debug:
      return FgBlue
    case LogLevel.Information:
      return FgGreen
    case LogLevel.Warning:
      return FgYellow
    case LogLevel.Error:
    case LogLevel.Fatal:
      return FgRed
  }
}

/**
 * The default formatter for the Console logger
 * @param entry the log entry to be formatted
 */
export const defaultFormatter = <T>(entry: ILeveledLogEntry<T>) => {
  const fontColor = getLevelColor(entry.level)
  return [`${fontColor}%s${Reset}`, entry.scope, entry.message]
}

/**
 * Formatter for a verbose message
 * @param entry the log entry
 */
export const verboseFormatter = <T>(entry: ILeveledLogEntry<T>) => {
  const fontColor = getLevelColor(entry.level)

  return entry.data
    ? [`${fontColor}%s${Reset}`, entry.scope, entry.message, entry.data]
    : [`${fontColor}%s${Reset}`, entry.scope, entry.message]
}

/**
 * Options for a Console Logger instance
 */
export interface IConsoleLoggerOptions extends ILoggerOptions {
  formatter: <T>(entry: ILeveledLogEntry<T>) => any[]
}

/**
 * A logger implementation that dumps log messages to the console
 */
export class ConsoleLogger extends AbstractLogger<IConsoleLoggerOptions> {
  public readonly options: IConsoleLoggerOptions

  /**
   *
   */
  constructor(options?: Partial<IConsoleLoggerOptions>) {
    super(options)
    this.options = {
      ...defaultLoggerOptions,
      ...{
        formatter: defaultFormatter,
      },
      ...options,
    }
  }

  public async AddEntry<T>(entry: ILeveledLogEntry<T>) {
    const data = this.options.formatter(entry)
    // tslint:disable-next-line:no-console
    console.log(...data)
  }
}
