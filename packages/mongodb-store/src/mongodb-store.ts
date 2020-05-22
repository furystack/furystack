import { FindOptions, PhysicalStore, selectFields, PartialResult, FilterType } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { Logger, ScopedLogger } from '@furystack/logging'
import { MongoClient, FilterQuery, Collection, OptionalId } from 'mongodb'

/**
 * TypeORM Store implementation for FuryStack
 */
export class MongodbStore<T> implements PhysicalStore<T> {
  public readonly primaryKey: keyof T

  public readonly model: Constructable<T>
  private readonly logger: ScopedLogger

  public async getCollection(): Promise<Collection<T>> {
    const client = await this.options.mongoClient()
    const collection = client.db(this.options.db).collection<T>(this.options.collection)
    return collection
  }

  constructor(
    private readonly options: {
      model: Constructable<T>
      primaryKey: keyof T
      db: string
      collection: string
      logger: Logger
      mongoClient: () => Promise<MongoClient>
    },
  ) {
    this.logger = this.options.logger.withScope(`@furystack/mongodb-store/${this.constructor.name}`)
    this.primaryKey = options.primaryKey
    this.model = options.model
    this.logger.verbose({
      message: `Initializing MongoDB Store for ${this.model.name}...`,
    })
  }
  public async add(...entries: T[]): Promise<void> {
    const collection = await this.getCollection()
    await collection.insertMany(entries as Array<OptionalId<T>>)
  }
  public async update(id: T[this['primaryKey']], data: Partial<T>): Promise<void> {
    const collection = await this.getCollection()
    await collection.updateOne({ _id: id } as any, { $set: data })
  }
  public async count(filter?: FilterType<T>): Promise<number> {
    const collection = await this.getCollection()
    return await collection.countDocuments(filter as FilterQuery<T>)
  }
  public async find<TFields extends Array<keyof T>>(
    filter: FindOptions<T, TFields>,
  ): Promise<Array<PartialResult<T, TFields[number]>>> {
    const collection = await this.getCollection()

    const sort = filter.order
      ? [...Object.keys(filter.order).map((key) => [key, (filter.order as any)[key] === 'ASC' ? 1 : -1])]
      : []

    const result = await collection
      .find(filter.filter as FilterQuery<T>)
      .skip(filter.skip || 0)
      .limit(filter.top || Number.MAX_SAFE_INTEGER)
      .sort(sort)
      .toArray()
    return result.map((entry) => (filter.select ? selectFields(entry, ...filter.select) : entry))
  }
  public async get(key: T[this['primaryKey']], select?: Array<keyof T>): Promise<T | undefined> {
    // ToDo: Projection
    const collection = await this.getCollection()
    const projection = select ? Object.fromEntries(select.map((field) => [field, 1])) : undefined
    const result = await collection.findOne({ [this.primaryKey]: { $eq: key } } as FilterQuery<T>, projection)
    return result || undefined
  }
  public async remove(...keys: Array<T[this['primaryKey']]>): Promise<void> {
    const collection = await this.getCollection()
    await collection.deleteMany({ [this.primaryKey]: { $in: keys } } as FilterQuery<T>)
  }
  public async dispose() {
    /** */
  }
}
