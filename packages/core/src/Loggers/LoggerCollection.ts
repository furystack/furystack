import { Injectable } from '@furystack/inject'
import { ILeveledLogEntry } from '../Models/ILogEntries'
import { ILogger } from '../Models/ILogger'
import { AbstractLogger } from './AbstractLogger'

/**
 * A specific logger that forwards its messages to a collection of loggers
 */
@Injectable()
export class LoggerCollection extends AbstractLogger {
  public async AddEntry<T>(entry: ILeveledLogEntry<T>): Promise<void> {
    const promises = this.loggers.filter(l => l.options.filter(entry)).map(l => l.AddEntry(entry))
    await Promise.all(promises)
  }

  private loggers: ILogger[] = []
  public attachLogger(...loggers: ILogger[]) {
    this.loggers.push(...loggers)
  }
}
