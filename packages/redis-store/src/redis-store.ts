import type { Constructable, CreateResult, PhysicalStore } from '@furystack/core'
import { EventHub } from '@furystack/utils'
import type { createClient } from 'redis'

/**
 * {@link PhysicalStore} backed by a Redis client.
 *
 * Each entity is stored as a single `SET` keyed by the entity's primary key,
 * value is `JSON.stringify(entity)`. The primary key column is constrained to
 * `string` because Redis keys are strings — the `TWriteableData` generic
 * narrows the input type accordingly.
 *
 * Client ownership stays with the caller — the store never connects or quits
 * the client. The store has no `[Symbol.asyncDispose]` because there is
 * nothing to release.
 *
 * **Contract deviation:** {@link find} and {@link count} throw — Redis has no
 * generic query surface and there is no in-memory mirror. Callers that need
 * collection queries must use a different adapter or maintain a secondary
 * index outside this store.
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
      client: ReturnType<typeof createClient>
      primaryKey: TPrimaryKey
    },
  ) {
    super()
    this.primaryKey = options.primaryKey
    this.model = options.model
  }
  public async add(...entries: TWriteableData[]): Promise<CreateResult<T>> {
    const created = await Promise.all(
      entries.map(async (entry) => {
        const key = entry[this.primaryKey]
        await this.options.client.set(key.toString(), JSON.stringify(entry))
        return entry
      }),
    )

    created.forEach((entry) => this.emit('onEntityAdded', { entity: entry as T }))

    return {
      created: created as T[],
    }
  }
  public async update(id: T[TPrimaryKey], data: T): Promise<void> {
    await this.options.client.set((id as string).toString(), JSON.stringify(data))
    this.emit('onEntityUpdated', { id, change: data })
  }
  public async count(): Promise<number> {
    throw Error('Not supported :(')
  }
  public async find(): Promise<T[]> {
    throw Error('Not supported :(')
  }
  public async get(key: T[TPrimaryKey]): Promise<T | undefined> {
    const value = await this.options.client.get((key as string).toString())
    return value ? (JSON.parse(value) as T) : undefined
  }
  public async remove(...keys: Array<T[TPrimaryKey]>): Promise<void> {
    await this.options.client.del(keys.map((key) => (key as string).toString()))
    keys.forEach((key) => this.emit('onEntityRemoved', { key }))
  }
}
