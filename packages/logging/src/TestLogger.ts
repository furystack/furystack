import { AbstractLogger } from './AbstractLogger'
import { LeveledLogEntry } from './LogEntries'
import { LoggerOptions } from './Logger'

/**
 * A test logger instance with a callback for added events
 */
export class TestLogger extends AbstractLogger {
  constructor(private readonly onAddEntry: <T>(entry: LeveledLogEntry<T>) => Promise<void>, options: LoggerOptions) {
    super(options)
  }
  public async addEntry<T>(entry: LeveledLogEntry<T>): Promise<void> {
    await this.onAddEntry(entry)
  }
}
