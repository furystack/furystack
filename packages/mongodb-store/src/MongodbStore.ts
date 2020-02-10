import { SearchOptions, PhysicalStore, selectFields, PartialResult } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { Logger, ScopedLogger } from '@furystack/logging'
import { MongoClient, FilterQuery } from 'mongodb'

/**
 * TypeORM Store implementation for FuryStack
 */
export class MongodbStore<T extends { _id: string }> implements PhysicalStore<T> {
  public readonly primaryKey = '_id'

  public readonly model: Constructable<T>
  private readonly logger: ScopedLogger

  public async getCollection() {
    const client = await this.options.mongoClient()
    return client.db(this.options.db).collection<T>(this.options.collection)
  }

  constructor(
    private readonly options: {
      model: Constructable<T>
      db: string
      collection: string
      logger: Logger
      mongoClient: () => Promise<MongoClient>
    },
  ) {
    this.logger = this.options.logger.withScope(`@furystack/mongodb-store/${this.constructor.name}`)

    this.model = options.model
    this.logger.verbose({
      message: `Initializing MongoDB Store for ${this.model.name}...`,
    })
  }
  public async add(data: Exclude<T, '_id'>): Promise<T> {
    const collection = await this.getCollection()
    const result = await collection.insertOne(data as any)
    return { _id: result.insertedId, ...data }
  }
  public async update(id: T[this['primaryKey']], data: T): Promise<void> {
    const collection = await this.getCollection()
    await collection.updateOne({ _id: id } as any, data)
  }
  public async count(filter: Partial<T>): Promise<number> {
    const collection = await this.getCollection()
    return await collection.countDocuments(filter) // ToDo: Test
  }
  public async search<TFields extends Array<keyof T>>(
    filter: SearchOptions<T, TFields>,
  ): Promise<Array<PartialResult<T, TFields[number]>>> {
    const collection = await this.getCollection()

    const sort = filter.order
      ? [...Object.keys(filter.order).map(key => [key, (filter.order as any)[key] === 'ASC' ? 1 : -1])]
      : []

    const result = await collection
      .find(filter.filter as FilterQuery<T>)
      .skip(filter.skip || 0)
      .limit(filter.top || Number.MAX_SAFE_INTEGER)
      .sort(sort)
      .toArray()
    return result.map(entry => (filter.select ? selectFields(entry, ...filter.select) : entry))
  }
  public async get(key: T[this['primaryKey']]): Promise<T | undefined> {
    const collection = await this.getCollection()
    const result = await collection.findOne({ _id: key } as any)
    return result || undefined
  }
  public async remove(key: T[this['primaryKey']]): Promise<void> {
    const collection = await this.getCollection()
    await collection.remove({ _id: key })
  }
  public async dispose() {
    /** */
  }
}
