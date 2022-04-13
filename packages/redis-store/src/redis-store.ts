import { PhysicalStore, CreateResult, WithOptionalId } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { HealthCheckable, HealthCheckResult } from '@furystack/utils'
import { createClient } from 'redis'

/**
 * TypeORM Store implementation for FuryStack
 */
export class RedisStore<T, TPrimaryKey extends keyof T> implements PhysicalStore<T, TPrimaryKey>, HealthCheckable {
  public primaryKey!: TPrimaryKey

  public readonly model: Constructable<T>

  constructor(
    public readonly options: {
      model: Constructable<T>
      client: ReturnType<typeof createClient>
      primaryKey: TPrimaryKey
    },
  ) {
    this.primaryKey = options.primaryKey
    this.model = options.model
  }
  public async checkHealth(): Promise<HealthCheckResult> {
    try {
      await this.options.client.ping()
      return {
        healthy: 'healthy',
      }
    } catch (error) {
      return {
        healthy: 'unhealthy',
        reason: {
          message: (error as Error).toString(),
        },
      }
    }
  }
  public async add(...entries: Array<WithOptionalId<T, TPrimaryKey>>): Promise<CreateResult<T>> {
    const created = await Promise.all(
      entries.map(async (entry) => {
        const key = entry[this.primaryKey]
        this.options.client.set((key as any).toString(), JSON.stringify(entry))
        return entry
      }),
    )

    return {
      created: created as T[],
    }
  }
  public async update(id: T[TPrimaryKey], data: T): Promise<void> {
    await this.options.client.set((id as any).toString(), JSON.stringify(data))
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
  }
  public async dispose() {
    /** */
  }
}
