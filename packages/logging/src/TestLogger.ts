import { AbstractLogger } from './AbstractLogger'
import { ILeveledLogEntry } from './ILogEntries'
import { ILoggerOptions } from './ILogger'

/**
 * A test logger instance with a callback for added events
 */
export class TestLogger extends AbstractLogger {
  constructor(
    private readonly onAddEntry: <T>(entry: ILeveledLogEntry<T>) => Promise<void>,
    options?: Partial<ILoggerOptions>,
  ) {
    super(options)
  }
  public async addEntry<T>(entry: ILeveledLogEntry<T>): Promise<void> {
    await this.onAddEntry(entry)
  }
}
