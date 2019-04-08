import { Injectable } from '@furystack/inject'
import { AbstractLogger } from './AbstractLogger'
import { ILeveledLogEntry } from './ILogEntries'
import { ILogger } from './ILogger'

/**
 * A specific logger that forwards its messages to a collection of loggers
 */
@Injectable({ lifetime: 'singleton' })
export class LoggerCollection extends AbstractLogger {
  public async addEntry<T>(entry: ILeveledLogEntry<T>): Promise<void> {
    const promises = this.loggers.filter(l => l.options.filter(entry)).map(l => l.addEntry(entry))
    await Promise.all(promises)
  }

  private loggers: ILogger[] = []
  public attachLogger(...loggers: ILogger[]) {
    this.loggers.push(...loggers)
  }
}
