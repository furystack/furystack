import { writeFileSync } from 'fs'
import { join } from 'path'
import { AbstractLogger, LeveledLogEntry } from '@furystack/logging'
import { Injectable } from '@furystack/inject'

@Injectable({ lifetime: 'singleton' })
export class InMemoryLogging extends AbstractLogger {
  public readonly entries: Array<LeveledLogEntry<any> & { added: Date }> = []

  public async addEntry<T>(entry: import('@furystack/logging').LeveledLogEntry<T>) {
    this.entries.push({ ...entry, added: new Date() })
  }

  public flushToFile(path: string = process.cwd(), logName = 'onboard.log') {
    writeFileSync(join(path, logName), JSON.stringify(this.entries, undefined, 2))
  }
}
