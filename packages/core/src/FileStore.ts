import { FSWatcher, readFile as nodeReadFile, watch, writeFile as nodeWriteFile } from 'fs'
import Semaphore from 'semaphore-async-await'
import { LoggerCollection } from './Loggers'
import { IPhysicalStore } from './Models/IPhysicalStore'

/**
 * Store implementation that stores info in a simple JSON file
 */
export class FileStore<T, K extends keyof T = keyof T> implements IPhysicalStore<T, K> {
  private readonly watcher?: FSWatcher
  public async remove(key: T[this['primaryKey']]): Promise<void> {
    this.cache.delete(key)
    this.hasChanges = true
  }
  public readonly logScope: string = '@furystack/core/' + this.constructor.name
  private cache: Map<T[this['primaryKey']], T> = new Map()
  public tick = setInterval(() => this.saveChanges(), this.tickMs)
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

  public filter = async (filter: Partial<T>) => {
    return await this.fileLock.execute(async () => {
      return [...this.cache.values()].filter(item => {
        for (const key in filter) {
          if (filter[key] !== (item as any)[key]) {
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
        this.writeFile(this.fileName, JSON.stringify(values), error => {
          if (!error) {
            resolve()
          } else {
            this.logger.error({
              scope: this.logScope,
              message: 'Error when saving store data to file:',
              data: { error },
            })
            reject(error)
          }
        })
      })
      this.hasChanges = false
    } finally {
      this.fileLock.release()
    }
  }

  public async dispose() {
    await this.saveChanges()
    this.watcher && this.watcher.close()
    clearInterval(this.tick)
  }

  public async reloadData() {
    try {
      await this.fileLock.acquire()
      await new Promise((resolve, reject) => {
        this.readFile(this.fileName, (error, data) => {
          if (error) {
            this.logger.error({
              scope: this.logScope,
              message: 'Error when loading store data from file:',
              data: { error },
            })
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
    } finally {
      this.fileLock.release()
    }
  }

  public async update(id: T[this['primaryKey']], data: T) {
    this.cache.set(id, data)
    this.hasChanges = true
  }

  constructor(
    private readonly fileName: string,
    public readonly primaryKey: K,
    public readonly tickMs = 10000,
    private readFile = nodeReadFile,
    private writeFile = nodeWriteFile,
    public logger = new LoggerCollection(),
  ) {
    try {
      this.watcher = watch(this.fileName, { encoding: 'buffer' }, () => {
        this.reloadData()
      })
    } catch (error) {
      this.logger.warning({
        scope: this.logScope,
        data: error,
        message: `Error registering file watcher for store. External updates won't be updated.`,
      })
    }
  }
}
