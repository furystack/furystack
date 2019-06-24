import { PhysicalStore } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { Logger, ScopedLogger } from '@furystack/logging'
import { RedisClient } from 'redis'

/**
 * TypeORM Store implementation for FuryStack
 */
export class RedisStore<T, K extends keyof T, KeyType extends T[K] & { toString: () => string }>
  implements PhysicalStore<T> {
  public primaryKey!: K

  public readonly model: Constructable<T>
  private readonly logger: ScopedLogger

  constructor(
    private readonly options: {
      model: Constructable<T>
      client: RedisClient
      logger: Logger
      primaryKey: K
    },
  ) {
    this.logger = this.options.logger.withScope(`@furystack/redis-store/${this.constructor.name}`)
    this.primaryKey = options.primaryKey

    this.model = options.model
    this.logger.verbose({
      message: `Initializing Redis Store for ${this.model.name}...`,
    })
  }
  public async add(data: T): Promise<T> {
    const key = data[this.primaryKey] as KeyType
    return await new Promise((resolve, reject) =>
      this.options.client.set(key.toString(), JSON.stringify(data), err => {
        err ? reject(err) : resolve(data)
      }),
    )
  }
  public async update(id: KeyType, data: T): Promise<void> {
    return await new Promise((resolve, reject) =>
      this.options.client.set(id.toString(), JSON.stringify(data), err => {
        err ? reject(err) : resolve()
      }),
    )
  }
  public async count(): Promise<number> {
    throw Error('Not supported :(')
  }
  public async search(): Promise<T[]> {
    throw Error('Not supported :(')
  }
  public async get(key: KeyType): Promise<T | undefined> {
    return await new Promise((resolve, reject) =>
      this.options.client.get(key.toString(), (err, val) => {
        if (err) {
          return reject()
        }
        resolve(JSON.parse(val) as T)
      }),
    )
  }
  public async remove(key: KeyType): Promise<void> {
    return await new Promise((resolve, reject) =>
      this.options.client.del(key.toString(), [], (err, val) => {
        if (err) {
          return reject()
        }
        resolve()
      }),
    )
  }
  public async dispose() {
    /** */
  }
}
