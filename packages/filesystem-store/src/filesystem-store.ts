import type { FilterType, FindOptions, PhysicalStore } from '@furystack/core'
import { InMemoryStore } from '@furystack/core'
import type { Constructable } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { FSWatcher } from 'fs'
import { promises, watch } from 'fs'
import { Lock } from 'semaphore-async-await'

/**
 * Store implementation that stores info in a simple JSON file
 */
export class FileSystemStore<T, TPrimaryKey extends keyof T>
  extends EventHub<{
    onEntityAdded: { entity: T }
    onEntityUpdated: { id: T[TPrimaryKey]; change: Partial<T> }
    onEntityRemoved: { key: T[TPrimaryKey] }
  }>
  implements PhysicalStore<T, TPrimaryKey, T>
{
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

  public tick: ReturnType<typeof setInterval>
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

  public async [Symbol.asyncDispose]() {
    await this.saveChanges()
    this.watcher?.close()
    clearInterval(this.tick)
    super[Symbol.dispose]()
  }

  public async reloadData() {
    try {
      await this.fileLock.acquire()
      const data = await this.readFile(this.options.fileName)
      const json = data ? (JSON.parse(data.toString()) as T[]) : []
      this.cache.clear()
      for (const entity of json) {
        this.cache.set(entity[this.primaryKey], entity)
      }
    } catch (err) {
      // ignore if file not exists yet
      if (err instanceof Error && (err as { code?: string }).code !== 'ENOENT') {
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
    super()
    this.primaryKey = options.primaryKey
    this.model = options.model
    this.inMemoryStore = new InMemoryStore({ model: this.model, primaryKey: this.primaryKey })
    this.tick = setInterval(() => void this.saveChanges(), this.options.tickMs || 3000)

    this.inMemoryStore.subscribe('onEntityAdded', ({ entity }) => {
      this.emit('onEntityAdded', { entity })
    })
    this.inMemoryStore.subscribe('onEntityUpdated', ({ id, change }) => {
      this.emit('onEntityUpdated', { id, change })
    })
    this.inMemoryStore.subscribe('onEntityRemoved', ({ key }) => {
      this.emit('onEntityRemoved', { key })
    })

    try {
      void this.reloadData()
      this.watcher = watch(this.options.fileName, { encoding: 'buffer' }, () => {
        void this.reloadData()
      })
    } catch (error) {
      // Error registering file watcher for store. External updates won't be updated.
    }
  }
}
