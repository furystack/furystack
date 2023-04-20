import type { FSWatcher } from 'fs'
import { promises, watch } from 'fs'
import type { Constructable } from '@furystack/inject'
import { Lock } from 'semaphore-async-await'
import type { PhysicalStore, FindOptions, FilterType } from '@furystack/core'
import { InMemoryStore } from '@furystack/core'

/**
 * Store implementation that stores info in a simple JSON file
 */
export class FileSystemStore<T, TPrimaryKey extends keyof T> implements PhysicalStore<T, TPrimaryKey, T> {
  private readonly watcher?: FSWatcher

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

  private fileLock = new Lock()
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
    } catch (err) {
      // ignore if file not exists yet
      if (err instanceof Error && (err as any).code !== 'ENOENT') {
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

  public readFile = promises.readFile
  public writeFile = promises.writeFile

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

    try {
      this.reloadData()
      this.watcher = watch(this.options.fileName, { encoding: 'buffer' }, () => {
        this.reloadData()
      })
    } catch (error) {
      // Error registering file watcher for store. External updates won't be updated.
    }
  }
}
