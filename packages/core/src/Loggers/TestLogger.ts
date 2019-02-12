import { ILoggerOptions } from '../Models'
import { ILeveledLogEntry } from '../Models/ILogEntries'
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
  public async AddEntry<T>(entry: ILeveledLogEntry<T>): Promise<void> {
    await this.onAddEntry(entry)
  }
}
