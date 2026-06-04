import type {
  Constructable,
  CreateResult,
  FilterType,
  FindOptions,
  PartialResult,
  PhysicalStore,
} from '@furystack/core'
import { filterItems, selectFields } from '@furystack/core'
import { EventHub } from '@furystack/utils'
import type { RedisClientType } from 'redis'

/**
 * {@link PhysicalStore} backed by a Redis client.
 *
 * **Key layout (namespaced).** Every entity is stored under
 * `${keyPrefix}:e:${primaryKey}` as `JSON.stringify(entity)`, and its primary
 * key is tracked in a per-store index Set at `${keyPrefix}:keys`. The index
 * scopes {@link find} / {@link count} to this store's own entities so multiple
 * stores (and other consumers — bus, task queue) can share one client without
 * collisions. `keyPrefix` defaults to the store name in `defineRedisStore`.
 *
 * **Partial updates.** {@link update} does a read-modify-write merge (see the
 * method doc) — it is **not** atomic against concurrent writes to the same key.
 *
 * **Query support.** {@link find} / {@link count} load the store's entities via
 * the index Set and apply filtering / ordering / projection in memory (reusing
 * `@furystack/core`'s `filterItems` / `selectFields`). This is an
 * O(store-size) scan per call — fine for control-plane lookups, but
 * high-cardinality query workloads should use `MongodbStore` /
 * `SequelizeStore`, which push the query to the server.
 *
 * Client ownership stays with the caller — the store never connects or quits
 * the client. The store has no `[Symbol.asyncDispose]` because there is
 * nothing to release.
 */
export class RedisStore<
  T,
  TPrimaryKey extends keyof T,
  TWriteableData extends { [K in TPrimaryKey]: string } = T & { [K in TPrimaryKey]: string },
>
  extends EventHub<{
    onEntityAdded: { entity: T }
    onEntityUpdated: { id: T[TPrimaryKey]; change: Partial<T> }
    onEntityRemoved: { key: T[TPrimaryKey] }
  }>
  implements PhysicalStore<T, TPrimaryKey, TWriteableData>
{
  public primaryKey: TPrimaryKey

  public readonly model: Constructable<T>

  constructor(
    private readonly options: {
      model: Constructable<T>
      client: RedisClientType
      primaryKey: TPrimaryKey
      /**
       * Per-store key namespace. Entity keys become `${keyPrefix}:e:${id}` and
       * the index Set `${keyPrefix}:keys`. Defaults to `''`; `defineRedisStore`
       * supplies the store name so each store is isolated on a shared client.
       */
      keyPrefix?: string
    },
  ) {
    super()
    this.primaryKey = options.primaryKey
    this.model = options.model
  }

  private get prefix(): string {
    return this.options.keyPrefix ?? ''
  }

  private get indexKey(): string {
    return `${this.prefix}:keys`
  }

  private entityKey(id: string): string {
    return `${this.prefix}:e:${id}`
  }

  public async add(...entries: TWriteableData[]): Promise<CreateResult<T>> {
    if (entries.length > 0) {
      const multi = this.options.client.multi()
      for (const entry of entries) {
        const id = String(entry[this.primaryKey])
        multi.set(this.entityKey(id), JSON.stringify(entry)).sAdd(this.indexKey, id)
      }
      await multi.exec()
    }

    entries.forEach((entry) => this.emit('onEntityAdded', { entity: entry as unknown as T }))
    return { created: entries as unknown as T[] }
  }

  /**
   * Partial update via read-modify-write: loads the current value, shallow-
   * merges `data` over it, and writes the result back. Matches the
   * {@link PhysicalStore} contract (`Partial<T>`) and `InMemoryStore`
   * semantics — fields absent from `data` are preserved, and fields set to
   * `undefined` are cleared (dropped by `JSON.stringify`).
   *
   * **Not atomic:** the GET and SET are separate commands, so two concurrent
   * updates to the *same key* can lose one another's changes (last write
   * wins). Callers that need cross-process field isolation on a hot key
   * should serialize writes themselves or use an adapter with server-side
   * partial updates (`MongodbStore`, `SequelizeStore`).
   */
  public async update(id: T[TPrimaryKey], data: Partial<T>): Promise<void> {
    const idStr = String(id)
    const key = this.entityKey(idStr)
    const existing = await this.options.client.get(key)
    const base = existing ? (JSON.parse(existing) as T) : ({} as T)
    const merged = { ...base, ...data }
    await this.options.client.multi().set(key, JSON.stringify(merged)).sAdd(this.indexKey, idStr).exec()
    this.emit('onEntityUpdated', { id, change: data })
  }

  public async count(filter?: FilterType<T>): Promise<number> {
    return filterItems(await this.loadAll(), filter).length
  }

  public async find<TFields extends Array<keyof T>>(
    findOptions: FindOptions<T, TFields>,
  ): Promise<Array<PartialResult<T, TFields>>> {
    let value: Array<PartialResult<T, TFields>> = filterItems(await this.loadAll(), findOptions.filter)

    if (findOptions.order) {
      const orderRecord = findOptions.order as Record<string, 'ASC' | 'DESC'>
      for (const fieldName of Object.keys(findOptions.order) as Array<keyof T>) {
        value = value.sort((a, b) => {
          const order = orderRecord[fieldName as string]
          if (a[fieldName] < b[fieldName]) return order === 'ASC' ? -1 : 1
          if (a[fieldName] > b[fieldName]) return order === 'ASC' ? 1 : -1
          return 0
        })
      }
    }

    if (findOptions.top || findOptions.skip) {
      value = value.slice(findOptions.skip, (findOptions.skip || 0) + (findOptions.top || value.length))
    }

    if (findOptions.select) {
      value = value.map((item) => selectFields(item, ...(findOptions.select as TFields)))
    }

    return value
  }

  public async get(key: T[TPrimaryKey]): Promise<T | undefined> {
    const value = await this.options.client.get(this.entityKey(String(key)))
    return value ? (JSON.parse(value) as T) : undefined
  }

  public async remove(...keys: Array<T[TPrimaryKey]>): Promise<void> {
    if (keys.length > 0) {
      const multi = this.options.client.multi()
      for (const key of keys) {
        const idStr = String(key)
        multi.del(this.entityKey(idStr)).sRem(this.indexKey, idStr)
      }
      await multi.exec()
    }
    keys.forEach((key) => this.emit('onEntityRemoved', { key }))
  }

  /**
   * Loads every entity tracked in the index Set. Index entries whose entity is
   * missing (e.g. a torn `remove`) are skipped, so a partial failure degrades
   * to a smaller result rather than a crash.
   */
  private async loadAll(): Promise<T[]> {
    const ids = await this.options.client.sMembers(this.indexKey)
    if (ids.length === 0) return []
    const values = await this.options.client.mGet(ids.map((id) => `${this.prefix}:e:${id}`))
    const entities: T[] = []
    for (const value of values) {
      if (value) entities.push(JSON.parse(value) as T)
    }
    return entities
  }
}
