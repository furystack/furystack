import { createLogger } from './create-logger.js'
import type { LeveledLogEntry } from './log-entries.js'
import type { Logger } from './logger.js'

/**
 * Creates a {@link Logger} that forwards every persisted entry to `onAddEntry`.
 * Convenient for asserting log output in tests.
 */
export const createTestLogger = (onAddEntry: <T>(entry: LeveledLogEntry<T>) => Promise<void>): Logger =>
  createLogger(onAddEntry)
