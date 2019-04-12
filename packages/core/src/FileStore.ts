import { Constructable } from '@furystack/inject'
import { ILogger } from '@furystack/logging'
import { FSWatcher, readFile as nodeReadFile, watch, writeFile as nodeWriteFile } from 'fs'
import Semaphore from 'semaphore-async-await'
import { DefaultFilter, IPhysicalStore } from './Models/IPhysicalStore'

/**
 * Store implementation that stores info in a simple JSON file
 */
export class FileStore<T> implements IPhysicalStore<T, DefaultFilter<T>> {
  private readonly watcher?: FSWatcher

  public readonly model: Constructable<T>

  public readonly primaryKey: keyof T
  public async remove(key: T[this['primaryKey']]): Promise<void> {
    this.cache.delete(key)
    this.hasChanges = true
  }
  public readonly logScope: string = '@furystack/core/' + this.constructor.name
  private cache: Map<T[this['primaryKey']], T> = new Map()
  public tick = setInterval(() => this.saveChanges(), this.options.tickMs || 5000)
  private hasChanges: boolean = false
  public get = async (key: T[this['primaryKey']]) => {
    return await this.fileLock.execute(async () => {
      return this.cache.get(key)
    })
  }

  public async add(data: T) {
    return await this.fileLock.execute(async () => {
      if (this.cache.has(data[this.primaryKey])) {
        throw new Error('Item with the same key already exists')
      }
      this.update(data[this.primaryKey], data)
      return data
    })
  }

  public filter = async (filter: DefaultFilter<T>) => {
    const { order, select, skip, top, ...filterFields } = filter
    return await this.fileLock.execute(async () => {
      return [...this.cache.values()].filter(item => {
        for (const key in filterFields) {
          if ((filterFields as any)[key] !== (item as any)[key]) {
            return false
          }
        }
        return true
      })
    })
  }

  public async count() {
    return await this.fileLock.execute(async () => {
      return this.cache.size
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
      this.options.logger.information({
        scope: this.logScope,
        message: `Store '${this.options.fileName}' has been updated with the latest changes.`,
        data: { values },
      })
    } catch (e) {
      this.options.logger.error({
        scope: this.logScope,
        message: `Error saving changed data to '${this.options.fileName}'.`,
        data: { error: e },
      })
    } finally {
      this.fileLock.release()
    }
  }

  public async dispose() {
    this.options.logger.information({
      scope: this.logScope,
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
      this.options.logger.error({
        scope: this.logScope,
        message: `Error loading data into store from '${this.options.fileName}'.`,
        data: e,
      })
    } finally {
      this.fileLock.release()
    }
  }

  public async update(id: T[this['primaryKey']], data: T) {
    this.cache.set(id, data)
    this.hasChanges = true
  }

  private readFile = nodeReadFile
  private writeFile = nodeWriteFile

  constructor(
    private readonly options: {
      fileName: string
      primaryKey: keyof T
      tickMs?: number
      logger: ILogger
      model: Constructable<T>
      readFile?: typeof nodeReadFile
      writeFile?: typeof nodeWriteFile
    },
  ) {
    this.primaryKey = options.primaryKey
    this.model = options.model
    options.readFile && (this.readFile = options.readFile)
    options.writeFile && (this.writeFile = options.writeFile)

    try {
      this.watcher = watch(this.options.fileName, { encoding: 'buffer' }, () => {
        this.options.logger.verbose({
          scope: this.logScope,
          message: `The file '${this.options.fileName}' has been changed, reloading data...`,
        })
        this.reloadData()
      })
    } catch (error) {
      // Error registering file watcher for store. External updates won't be updated.
    }
  }
}
