import { FindOptions, PhysicalStore, PartialResult, FilterType, WithOptionalId, CreateResult } from '@furystack/core'
import { Constructable } from '@furystack/inject'
import { MongoClient, FilterQuery, Collection, OptionalId, ObjectId } from 'mongodb'
import Semaphore from 'semaphore-async-await'

/**
 * TypeORM Store implementation for FuryStack
 */
export class MongodbStore<T, TPrimaryKey extends keyof T> implements PhysicalStore<T, TPrimaryKey> {
  public readonly primaryKey: TPrimaryKey

  public readonly model: Constructable<T>

  private initLock = new Semaphore(1)
  private collection?: Collection<T>

  private createIdFilter(...values: Array<T[this['primaryKey']]>): FilterQuery<T> {
    return {
      [this.primaryKey]: {
        $in: this.primaryKey === '_id' ? values.map((value) => new ObjectId(value as any)) : values,
      },
    } as FilterQuery<T>
  }

  private stringifyResultId(item: any): T {
    if (this.primaryKey === '_id' && item._id instanceof ObjectId) {
      return {
        ...item,
        _id: item._id.toHexString(),
      }
    }
    return item
  }

  private parseFilter(filter: FilterType<T>): FilterType<T> {
    if (Object.keys(filter).includes('_id')) {
      const f = { ...(filter as any) }
      if (typeof f._id === 'string') {
        return {
          ...f,
          _id: new ObjectId(f._id),
        }
      }
      if (typeof f._id === 'object') {
        if (f._id.$eq) {
          f._id.$eq = new ObjectId(f._id.$eq)
        }
        if (f._id.$in && f._id.$in instanceof Array) {
          f._id.$in = f._id.$in.map((id: string) => new ObjectId(id))
        }
        if (f._id.$nin && f._id.$nin instanceof Array) {
          f._id.$nin = f._id.$nin.map((id: string) => new ObjectId(id))
        }
      }
      return f
    }
    return filter
  }

  public async getCollection(): Promise<Collection<T>> {
    if (this.collection) {
      return this.collection
    }
    await this.initLock.acquire()
    if (this.collection) {
      return this.collection
    }
    try {
      const client = await this.options.mongoClient()
      const collection = client.db(this.options.db).collection<T>(this.options.collection)
      if (this.primaryKey !== '_id') {
        await collection.createIndex({ [this.primaryKey]: 1 }, { unique: true })
      }
      this.collection = collection
      return collection
    } finally {
      this.initLock.release()
    }
  }

  constructor(
    private readonly options: {
      model: Constructable<T>
      primaryKey: TPrimaryKey
      db: string
      collection: string
      mongoClient: () => Promise<MongoClient>
    },
  ) {
    this.primaryKey = options.primaryKey
    this.model = options.model
  }
  public async add(...entries: Array<WithOptionalId<T, this['primaryKey']>>): Promise<CreateResult<T>> {
    const collection = await this.getCollection()
    const result = await collection.insertMany(entries.map((e) => (({ ...e } as any) as OptionalId<T>)))
    return {
      created:
        this.primaryKey === '_id'
          ? (result.ops.map((entity) => this.stringifyResultId(entity)) as T[])
          : ((result.ops.map((entity) => {
              const { _id, ...r } = entity
              return r
            }) as any) as T[]),
    }
  }
  public async update(id: T[this['primaryKey']], data: Partial<T>): Promise<void> {
    const collection = await this.getCollection()
    const updateResult = await collection.updateOne(this.createIdFilter(id), { $set: data })
    if (updateResult.matchedCount < 1) {
      throw Error(`Entity not found with id '${id}', cannot update!`)
    }
  }
  public async count(filter?: FilterType<T>): Promise<number> {
    const collection = await this.getCollection()
    return await collection.countDocuments(filter && (this.parseFilter(filter) as FilterQuery<T>))
  }
  public async find<TFields extends Array<keyof T>>(
    filter: FindOptions<T, TFields>,
  ): Promise<Array<PartialResult<T, TFields>>> {
    const collection = await this.getCollection()

    const sort = filter.order
      ? [
          ...Object.keys(filter.order).map<[string, number]>((key) => [
            key,
            (filter.order as any)[key] === 'ASC' ? 1 : -1,
          ]),
        ]
      : []

    const result = await collection
      .find(filter.filter && (this.parseFilter(filter.filter) as FilterQuery<T>))
      .project(this.getProjection(filter.select))
      .skip(filter.skip || 0)
      .limit(filter.top || Number.MAX_SAFE_INTEGER)
      .sort(sort)
      .toArray()
    return result.map((entity) => this.stringifyResultId(entity))
  }

  private getProjection(fields?: Array<keyof T>) {
    return {
      ...(this.primaryKey !== '_id' ? { _id: 0 } : {}),
      ...(fields ? Object.fromEntries(fields.map((field) => [field, 1])) : {}),
    }
  }

  public async get(key: T[this['primaryKey']], select?: Array<keyof T>): Promise<T | undefined> {
    const collection = await this.getCollection()
    const projection = this.getProjection(select)
    const result = await collection.findOne(this.createIdFilter(key), {
      projection,
    })
    return result ? this.stringifyResultId(result) : undefined
  }
  public async remove(...keys: Array<T[this['primaryKey']]>): Promise<void> {
    const collection = await this.getCollection()
    await collection.deleteMany(this.createIdFilter(...keys))
  }
  public async dispose() {
    /** */
  }
}
