import { DefaultFilter, IPhysicalStore } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { ILogger, ScopedLogger } from '@furystack/logging'
import { RedisClient } from 'redis'

/**
 * TypeORM Store implementation for FuryStack
 */
export class RedisStore<T> implements IPhysicalStore<T> {
  public primaryKey!: keyof T

  public readonly model: Constructable<T>
  private readonly logger: ScopedLogger

  constructor(
    private readonly options: {
      model: Constructable<T>
      client: RedisClient
      logger: ILogger
      primaryKey: keyof T
    },
  ) {
    this.logger = this.options.logger.withScope('@furystack/redis-store/' + this.constructor.name)
    this.primaryKey = options.primaryKey

    this.model = options.model
    this.logger.verbose({
      message: `Initializing Redis Store for ${this.model.name}...`,
    })
  }
  public async add(data: T): Promise<T> {
    const key = data[this.primaryKey]
    return await new Promise((resolve, reject) =>
      this.options.client.set(key.toString(), JSON.stringify(data), err => {
        err ? reject(err) : resolve(data)
      }),
    )
  }
  public async update(id: T[this['primaryKey']], data: T): Promise<void> {
    return await new Promise((resolve, reject) =>
      this.options.client.set(id.toString(), JSON.stringify(data), err => {
        err ? reject(err) : resolve()
      }),
    )
  }
  public async count(): Promise<number> {
    throw Error('Not supported :(')
  }
  public async filter(filter: DefaultFilter<T>): Promise<T[]> {
    throw Error('Not supported :(')
  }
  public async get(key: T[this['primaryKey']]): Promise<T | undefined> {
    return await new Promise((resolve, reject) =>
      this.options.client.get(key.toString(), (err, val) => {
        if (err) {
          return reject()
        }
        resolve(JSON.parse(val) as T)
      }),
    )
  }
  public async remove(key: T[this['primaryKey']]): Promise<void> {
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
