import type { CreateResult, PhysicalStore } from '@furystack/core'
import type { Constructable } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { createClient } from 'redis'

/**
 * TypeORM Store implementation for FuryStack
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
        await this.options.client.set((key as any).toString(), JSON.stringify(entry))
        return entry
      }),
    )

    created.forEach((entry) => this.emit('onEntityAdded', { entity: entry as T }))

    return {
      created: created as T[],
    }
  }
  public async update(id: T[TPrimaryKey], data: T): Promise<void> {
    await this.options.client.set((id as any).toString(), JSON.stringify(data))
    this.emit('onEntityUpdated', { id, change: data })
  }
  public async count(): Promise<number> {
    throw Error('Not supported :(')
  }
  public async find(): Promise<T[]> {
    throw Error('Not supported :(')
  }
  public async get(key: T[TPrimaryKey]): Promise<T | undefined> {
    const value = await this.options.client.get((key as any).toString())
    return value ? JSON.parse(value) : undefined
  }
  public async remove(...keys: Array<T[TPrimaryKey]>): Promise<void> {
    await Promise.all(keys.map(async (key) => await this.options.client.del((key as any).toString(), [])))
    keys.forEach((key) => this.emit('onEntityRemoved', { key }))
  }
}
