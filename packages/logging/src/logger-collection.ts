import { Injectable } from '@furystack/inject'
import { AbstractLogger } from './abstract-logger.js'
import type { LeveledLogEntry } from './log-entries.js'
import type { Logger } from './logger.js'

/**
 * A specific logger that forwards its messages to a collection of loggers
 */
@Injectable({ lifetime: 'singleton' })
export class LoggerCollection extends AbstractLogger {
  public async addEntry<T>(entry: LeveledLogEntry<T>): Promise<void> {
    const promises = this.loggers.map((l) => (l !== this ? l.addEntry(entry) : Promise.resolve()))
    await Promise.all(promises)
  }

  private loggers: Logger[] = []
  public attachLogger(...loggers: Logger[]) {
    this.loggers.push(...loggers)
  }

  public detach(logger: Logger) {
    this.loggers = this.loggers.filter((l) => l !== logger)
  }
}
