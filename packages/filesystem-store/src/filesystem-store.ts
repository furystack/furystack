import { constants, FSWatcher, watch } from 'fs'
import { Constructable } from '@furystack/inject'
import Semaphore from 'semaphore-async-await'
import { InMemoryStore, PhysicalStore, FindOptions, FilterType, WithOptionalId } from '@furystack/core'
import { HealthCheckable, HealthCheckResult } from '@furystack/utils'
import { access, readFile, writeFile } from 'fs/promises'

/**
 * Store implementation that stores info in a simple JSON file
 */
export class FileSystemStore<T, TPrimaryKey extends keyof T> implements PhysicalStore<T, TPrimaryKey>, HealthCheckable {
  private watcher?: FSWatcher

  public readonly model: Constructable<T>

  public readonly primaryKey: TPrimaryKey

  private readonly inMemoryStore: InMemoryStore<T, TPrimaryKey>

  private get cache() {
    return this.inMemoryStore.cache
  }

  public async remove(...keys: Array<T[TPrimaryKey]>): Promise<void> {
    await this.fileLock.execute(async () => {
      await this.inMemoryStore.remove(...keys)
    })
    this.hasChanges = true
  }

  public tick = setInterval(() => this.saveChanges(), this.options.tickMs || 3000)
  public hasChanges = false
  public async get(key: T[TPrimaryKey], select?: Array<keyof T>) {
    return await this.fileLock.execute(async () => {
      return await this.inMemoryStore.get(key, select)
    })
  }

  public async add(...entries: Array<WithOptionalId<T, TPrimaryKey>>) {
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
      await writeFile(this.options.fileName, JSON.stringify(values))
      this.hasChanges = false
    } finally {
      this.fileLock.release()
    }
  }

  public async dispose() {
    this.watcher && this.watcher.close()
    clearInterval(this.tick)
    await this.saveChanges()
  }

  public async reloadData() {
    try {
      await this.fileLock.acquire()
      const data = await readFile(this.options.fileName)
      const json = (data ? JSON.parse(data.toString()) : []) as T[]
      this.cache.clear()
      for (const entity of json) {
        this.cache.set(entity[this.primaryKey], entity)
      }
    } catch (err) {
      if ((err as any).code === 'ENOENT') {
        // File doesn't exists yet, try to save it
        this.hasChanges = true
        this.fileLock.release()
        await this.saveChanges()
        await this.fileLock.acquire()
        this.tryAttachWatcher()
      } else {
        throw err
      }
    } finally {
      this.fileLock.release()
    }
  }

  public async update(id: T[TPrimaryKey], data: T) {
    await this.fileLock.execute(async () => {
      return this.inMemoryStore.update(id, data)
    })
    this.hasChanges = true
  }

  constructor(
    private readonly options: {
      fileName: string
      primaryKey: TPrimaryKey
      tickMs?: number
      model: Constructable<T>
    },
  ) {
    this.primaryKey = options.primaryKey
    this.model = options.model
    this.inMemoryStore = new InMemoryStore({ model: this.model, primaryKey: this.primaryKey })

    this.reloadData()
    this.tryAttachWatcher()
  }

  private tryAttachWatcher() {
    try {
      this.watcher = watch(this.options.fileName, { encoding: 'buffer' }, () => {
        this.reloadData()
      })
    } catch (error) {
      // ignore
    }
  }

  public async checkHealth(): Promise<HealthCheckResult> {
    const problems: string[] = []

    try {
      await access(this.options.fileName, constants.R_OK | constants.W_OK)
    } catch (error) {
      problems.push(`File ${this.options.fileName} is not accessible for reading and writing.`)
    }

    if (!this.watcher) {
      problems.push('File watcher not registered')
    }
    if (problems.length) {
      return {
        healthy: 'unhealthy',
        reason: problems,
      }
    }
    return {
      healthy: 'healthy',
    }
  }
}
