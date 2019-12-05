import { AbstractLogger, LeveledLogEntry } from '@furystack/logging'
import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class InMemoryLogging extends AbstractLogger {
  public readonly entries: Array<LeveledLogEntry<any>> = []

  public async addEntry<T>(entry: import('@furystack/logging').LeveledLogEntry<T>) {
    this.entries.push(entry)
  }
}
