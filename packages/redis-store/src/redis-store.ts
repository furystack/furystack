import { PhysicalStore, CreateResult } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { RedisClient } from 'redis'

/**
 * TypeORM Store implementation for FuryStack
 */
export class RedisStore<T, K extends keyof T> implements PhysicalStore<T> {
  public primaryKey!: K

  public readonly model: Constructable<T>

  constructor(
    private readonly options: {
      model: Constructable<T>
      client: RedisClient
      primaryKey: K
    },
  ) {
    this.primaryKey = options.primaryKey
    this.model = options.model
  }
  public async add(...entries: T[]): Promise<CreateResult<T>> {
    const created = await Promise.all(
      entries.map(async (entry) => {
        const key = entry[this.primaryKey]
        return await new Promise<T>((resolve, reject) =>
          this.options.client.set((key as any).toString(), JSON.stringify(entry), (err) => {
            err ? reject(err) : resolve(entry)
          }),
        )
      }),
    )
    return {
      created,
    }
  }
  public async update(id: T[this['primaryKey']], data: T): Promise<void> {
    return await new Promise((resolve, reject) =>
      this.options.client.set((id as any).toString(), JSON.stringify(data), (err) => {
        err ? reject(err) : resolve()
      }),
    )
  }
  public async count(): Promise<number> {
    throw Error('Not supported :(')
  }
  public async find(): Promise<T[]> {
    throw Error('Not supported :(')
  }
  public async get(key: T[this['primaryKey']]): Promise<T | undefined> {
    return await new Promise((resolve, reject) =>
      this.options.client.get((key as any).toString(), (err, val) => {
        err ? reject(err) : resolve(JSON.parse(val as string) as T)
      }),
    )
  }
  public async remove(...keys: Array<T[this['primaryKey']]>): Promise<void> {
    await Promise.all(
      keys.map(
        async (key) =>
          await new Promise<void>((resolve, reject) =>
            this.options.client.del((key as any).toString(), [], (err) => {
              err ? reject(err) : resolve()
            }),
          ),
      ),
    )
  }
  public async dispose() {
    /** */
  }
}
