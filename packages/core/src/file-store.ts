import { FSWatcher, readFile as nodeReadFile, watch, writeFile as nodeWriteFile } from 'fs'
import { Constructable } from '@furystack/inject'
import { Logger, ScopedLogger } from '@furystack/logging'
import Semaphore from 'semaphore-async-await'
import { InMemoryStore } from './in-memory-store'
import { PhysicalStore, SearchOptions } from './models/physical-store'

/**
 * Store implementation that stores info in a simple JSON file
 */
export class FileStore<T> implements PhysicalStore<T> {
  private readonly watcher?: FSWatcher

  public readonly model: Constructable<T>

  public readonly primaryKey: keyof T

  private readonly inMemoryStore: InMemoryStore<T>

  private get cache() {
    // eslint-disable-next-line dot-notation
    return this.inMemoryStore['cache']
  }

  public async remove(key: T[this['primaryKey']]): Promise<void> {
    await this.fileLock.execute(async () => {
      await this.inMemoryStore.remove(key)
    })
    this.hasChanges = true
  }

  public tick = setInterval(() => this.saveChanges(), this.options.tickMs || 3000)
  private hasChanges = false
  public async get(key: T[this['primaryKey']]) {
    return await this.fileLock.execute(async () => {
      return await this.inMemoryStore.get(key)
    })
  }

  public async add(data: T) {
    return await this.fileLock.execute(async () => {
      return await this.inMemoryStore.add(data)
    })
  }

  public async search<TFields extends Array<keyof T>>(filter: SearchOptions<T, TFields>) {
    return await this.fileLock.execute(async () => {
      return this.inMemoryStore.search(filter)
    })
  }

  public async count(filter?: Partial<T>) {
    return await this.fileLock.execute(async () => {
      return this.inMemoryStore.count(filter)
    })
  }

  private fileLock = new Semaphore(1)
  private async saveChanges() {
    if (!this.hasChanges) {
      return
    }
    try {
      await this.fileLock.acquire()
      const values: T[] = []
      for (const key of this.cache.keys()) {
        values.push(this.cache.get(key) as T)
      }
      await new Promise((resolve, reject) => {
        this.writeFile(this.options.fileName, JSON.stringify(values), error => {
          if (!error) {
            resolve()
          } else {
            reject(error)
          }
        })
      })
      this.hasChanges = false
      this.logger.information({
        message: `Store '${this.options.fileName}' has been updated with the latest changes.`,
        data: { values },
      })
    } catch (e) {
      this.logger.error({
        message: `Error saving changed data to '${this.options.fileName}'.`,
        data: { error: e },
      })
    } finally {
      this.fileLock.release()
    }
  }

  public async dispose() {
    this.logger.information({
      message: `Disposing FileStore: '${this.options.fileName}'`,
    })
    await this.saveChanges()
    this.watcher && this.watcher.close()
    clearInterval(this.tick)
  }

  public async reloadData() {
    try {
      await this.fileLock.acquire()
      await new Promise((resolve, reject) => {
        this.readFile(this.options.fileName, (error, data) => {
          if (error) {
            reject(error)
          } else {
            this.cache.clear()
            const json = JSON.parse(data.toString()) as T[]
            for (const user of json) {
              this.cache.set(user[this.primaryKey], user)
            }
            resolve()
          }
        })
      })
    } catch (e) {
      this.logger.error({
        message: `Error loading data into store from '${this.options.fileName}'.`,
        data: e,
      })
    } finally {
      this.fileLock.release()
    }
  }

  public async update(id: T[this['primaryKey']], data: T) {
    await this.fileLock.execute(async () => {
      return this.inMemoryStore.update(id, data)
    })
    this.hasChanges = true
  }

  private readFile = nodeReadFile
  private writeFile = nodeWriteFile

  private logger: ScopedLogger

  constructor(
    private readonly options: {
      fileName: string
      primaryKey: keyof T
      tickMs?: number
      logger: Logger
      model: Constructable<T>
      readFile?: typeof nodeReadFile
      writeFile?: typeof nodeWriteFile
    },
  ) {
    this.primaryKey = options.primaryKey
    this.model = options.model
    this.logger = options.logger.withScope(`@furystack/core/${this.constructor.name}`)
    options.readFile && (this.readFile = options.readFile)
    options.writeFile && (this.writeFile = options.writeFile)
    this.inMemoryStore = new InMemoryStore({ model: this.model, primaryKey: this.primaryKey })

    try {
      this.reloadData()
      this.watcher = watch(this.options.fileName, { encoding: 'buffer' }, () => {
        this.logger.verbose({
          message: `The file '${this.options.fileName}' has been changed, reloading data...`,
        })
        this.reloadData()
      })
    } catch (error) {
      // Error registering file watcher for store. External updates won't be updated.
    }
  }
}
