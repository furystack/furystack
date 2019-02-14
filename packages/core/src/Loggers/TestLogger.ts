import { ILeveledLogEntry } from '../Models/ILogEntries'
import { ILoggerOptions } from '../Models/ILogger'
import { AbstractLogger } from './AbstractLogger'

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
