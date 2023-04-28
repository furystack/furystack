import { AbstractLogger } from './abstract-logger.js'
import type { LeveledLogEntry } from './log-entries.js'

/**
 * A test logger instance with a callback for added events
 */
export class TestLogger extends AbstractLogger {
  constructor(private readonly onAddEntry: <T>(entry: LeveledLogEntry<T>) => Promise<void>) {
    super()
  }

  public async addEntry<T>(entry: LeveledLogEntry<T>): Promise<void> {
    await this.onAddEntry(entry)
  }
}
