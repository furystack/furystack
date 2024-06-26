import { Injectable } from '@furystack/inject'
import { AbstractLogger } from './abstract-logger.js'
import type { LeveledLogEntry } from './log-entries.js'
import type { LogLevel } from './log-entries.js'

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
 * @param level the log level
 * @returns an associated color to a specific log level
 */
export const getLevelColor = (level: LogLevel) => {
  switch (level) {
    case 'verbose':
      return FgCyan
    case 'debug':
      return FgBlue
    case 'information':
      return FgGreen
    case 'warning':
      return FgYellow
    case 'error':
      return FgRed
    default:
      return FgRed
  }
}

/**
 * @param entry the log entry to be formatted
 * @returns the formatted message
 */
export const defaultFormat = <T>(entry: LeveledLogEntry<T>) => {
  const fontColor = getLevelColor(entry.level)
  return [`${fontColor}%s${Reset}`, entry.scope, entry.message]
}

/**
 * @param entry the log entry
 * @returns the formatted message
 */
export const verboseFormat = <T>(entry: LeveledLogEntry<T>) => {
  const fontColor = getLevelColor(entry.level)
  return entry.data
    ? [`${fontColor}%s${Reset}`, entry.scope, entry.message, entry.data]
    : [`${fontColor}%s${Reset}`, entry.scope, entry.message]
}

/**
 * A logger implementation that dumps log messages to the console
 */
@Injectable({ lifetime: 'scoped' })
export class ConsoleLogger extends AbstractLogger {
  public async addEntry<T>(entry: LeveledLogEntry<T>) {
    const data = defaultFormat(entry)
    console.log(...data)
  }
}

@Injectable({ lifetime: 'scoped' })
export class VerboseConsoleLogger extends AbstractLogger {
  public async addEntry<T>(entry: LeveledLogEntry<T>) {
    const data = verboseFormat(entry)
    console.log(...data)
  }
}
