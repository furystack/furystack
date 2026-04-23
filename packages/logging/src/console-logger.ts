import { defineService } from '@furystack/inject'
import type { Token } from '@furystack/inject'
import { createLogger } from './create-logger.js'
import type { LeveledLogEntry, LogLevel } from './log-entries.js'
import type { Logger } from './logger.js'

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
 * Magenta console foreground color
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
export const getLevelColor = (level: LogLevel): string => {
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
    case 'fatal':
      return FgMagenta
    default:
      return FgRed
  }
}

/**
 * @param entry the log entry to be formatted
 * @returns the formatted message
 */
export const defaultFormat = <T>(entry: LeveledLogEntry<T>): unknown[] => {
  const fontColor = getLevelColor(entry.level)
  return [`${fontColor}%s${Reset}`, entry.scope, entry.message]
}

/**
 * @param entry the log entry
 * @returns the formatted message
 */
export const verboseFormat = <T>(entry: LeveledLogEntry<T>): unknown[] => {
  const fontColor = getLevelColor(entry.level)
  return entry.data
    ? [`${fontColor}%s${Reset}`, entry.scope, entry.message, entry.data]
    : [`${fontColor}%s${Reset}`, entry.scope, entry.message]
}

/**
 * Token for a {@link Logger} that writes each entry to the console using
 * {@link defaultFormat}. Stateless and therefore registered as a singleton.
 */
export const ConsoleLogger: Token<Logger, 'singleton'> = defineService({
  name: '@furystack/logging/ConsoleLogger',
  lifetime: 'singleton',
  factory: () =>
    createLogger(async (entry) => {
      const data = defaultFormat(entry)
      console.log(...data)
      await Promise.resolve()
    }),
})

/**
 * Like {@link ConsoleLogger} but prints additional entry data when present.
 */
export const VerboseConsoleLogger: Token<Logger, 'singleton'> = defineService({
  name: '@furystack/logging/VerboseConsoleLogger',
  lifetime: 'singleton',
  factory: () =>
    createLogger(async (entry) => {
      const data = verboseFormat(entry)
      console.log(...data)
      await Promise.resolve()
    }),
})
