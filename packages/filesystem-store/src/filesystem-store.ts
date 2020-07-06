import { FSWatcher, promises, watch } from 'fs'
import { Constructable } from '@furystack/inject'
import { Logger, ScopedLogger } from '@furystack/logging'
import Semaphore from 'semaphore-async-await'
import { InMemoryStore, PhysicalStore, FindOptions, FilterType } from '@furystack/core'

/**
 * Store implementation that stores info in a simple JSON file
 */
export class FileSystemStore<T> implements PhysicalStore<T> {
  private readonly watcher?: FSWatcher

  public readonly model: Constructable<T>

  public readonly primaryKey: keyof T

  private readonly inMemoryStore: InMemoryStore<T>

  private get cache() {
    return this.inMemoryStore.cache
  }

  public async remove(...keys: Array<T[this['primaryKey']]>): Promise<void> {
    await this.fileLock.execute(async () => {
      await this.inMemoryStore.remove(...keys)
    })
    this.hasChanges = true
  }

  public tick = setInterval(() => this.saveChanges(), this.options.tickMs || 3000)
  public hasChanges = false
  public async get(key: T[this['primaryKey']], select?: Array<keyof T>) {
    return await this.fileLock.execute(async () => {
      return await this.inMemoryStore.get(key, select)
    })
  }

  public async add(...entries: T[]) {
    const result = await this.fileLock.execute(async () => {
      return await this.inMemoryStore.add(...entries)
    })
    this.hasChanges = true
    return result
  }

  public async find<TFields extends Array<keyof T>>(filter: FindOptions<T, TFields>) {
    return await this.fileLock.execute(async () => {
      return this.inMemoryStore.find(filter)
    })
  }

  public async count(filter?: FilterType<T>) {
    return await this.fileLock.execute(async () => {
      return this.inMemoryStore.count(filter)
    })
  }

  private fileLock = new Semaphore(1)
  public async saveChanges() {
    if (!this.hasChanges) {
      return
    }
    try {
      await this.fileLock.acquire()
      const values: T[] = []
      for (const key of this.cache.keys()) {
        values.push(this.cache.get(key) as T)
      }
      await this.writeFile(this.options.fileName, JSON.stringify(values))
      this.hasChanges = false
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
    await this.saveChanges()
    this.watcher && this.watcher.close()
    clearInterval(this.tick)
  }

  public async reloadData() {
    try {
      await this.fileLock.acquire()
      const data = await this.readFile(this.options.fileName)
      const json = (data ? JSON.parse(data.toString()) : []) as T[]
      this.cache.clear()
      for (const entity of json) {
        this.cache.set(entity[this.primaryKey], entity)
      }
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

  public readFile = promises.readFile
  public writeFile = promises.writeFile

  private logger: ScopedLogger

  constructor(
    private readonly options: {
      fileName: string
      primaryKey: keyof T
      tickMs?: number
      logger: Logger
      model: Constructable<T>
    },
  ) {
    this.primaryKey = options.primaryKey
    this.model = options.model
    this.logger = options.logger.withScope(`@furystack/core/${this.constructor.name}`)
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
