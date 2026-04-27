import type { Constructable, defineStore, FilterType, FindOptions, PhysicalStore } from '@furystack/core'
import { InMemoryStore } from '@furystack/core'
import { EventHub, type ListenerErrorPayload } from '@furystack/utils'
import type { FSWatcher } from 'fs'
import { promises, watch } from 'fs'

const DEFAULT_TICK_MS = 3000

/**
 * {@link PhysicalStore} backed by a JSON file on disk.
 *
 * Reads on construction, holds entities in an {@link InMemoryStore}, and flushes
 * pending writes on a `tickMs` interval (default 3000 ms). External edits to the
 * file are picked up via an `fs.watch` watcher that triggers {@link reloadData}.
 *
 * Disposal is async — `[Symbol.asyncDispose]` flushes pending changes, closes
 * the watcher, and clears the interval. Owners must `await` disposal or rely on
 * `await using` / {@link defineStore}'s `onDispose` hook to avoid lost writes.
 *
 * Re-emits `onEntityAdded` / `onEntityUpdated` / `onEntityRemoved` from the
 * underlying in-memory store, plus `onWatcherError` when the FS watcher fails.
 */
export class FileSystemStore<T, TPrimaryKey extends keyof T>
  extends EventHub<{
    onEntityAdded: { entity: T }
    onEntityUpdated: { id: T[TPrimaryKey]; change: Partial<T> }
    onEntityRemoved: { key: T[TPrimaryKey] }
    onWatcherError: { error: unknown }
    onListenerError: ListenerErrorPayload
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
    await this.inMemoryStore.remove(...keys)
    this.hasChanges = true
  }

  public tick: ReturnType<typeof setInterval>
  public hasChanges = false
  public async get(key: T[TPrimaryKey], select?: Array<keyof T>) {
    return await this.inMemoryStore.get(key, select)
  }

  public async add(...entries: T[]) {
    const result = await this.inMemoryStore.add(...entries)
    this.hasChanges = true
    return result
  }

  public async find<TFields extends Array<keyof T>>(filter: FindOptions<T, TFields>) {
    return this.inMemoryStore.find(filter)
  }

  public async count(filter?: FilterType<T>) {
    return this.inMemoryStore.count(filter)
  }

  /**
   * Writes the in-memory cache to disk if {@link hasChanges} is set. No-op
   * otherwise — the periodic tick calls this on every interval but only the
   * first call after a mutation actually touches the filesystem.
   */
  public async saveChanges() {
    if (!this.hasChanges) {
      return
    }
    const values: T[] = []
    for (const key of this.cache.keys()) {
      values.push(this.cache.get(key) as T)
    }
    await this.writeFile(this.options.fileName, JSON.stringify(values))
    this.hasChanges = false
  }

  /**
   * Flushes pending changes, closes the FS watcher and clears the tick interval.
   * Must be awaited — skipping `await` risks losing the final write.
   */
  public async [Symbol.asyncDispose]() {
    await this.saveChanges()
    this.watcher?.close()
    clearInterval(this.tick)
    super[Symbol.dispose]()
  }

  /**
   * Replaces the in-memory cache with the contents of the backing file. Called
   * on construction and on every FS watcher event. Missing file (`ENOENT`) is
   * silently ignored so first-run writes succeed against a fresh path.
   */
  public async reloadData() {
    try {
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
    }
  }

  public async update(id: T[TPrimaryKey], data: T) {
    await this.inMemoryStore.update(id, data)
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
    this.tick = setInterval(() => void this.saveChanges(), this.options.tickMs || DEFAULT_TICK_MS)

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
      this.emit('onWatcherError', { error })
    }
  }
}
