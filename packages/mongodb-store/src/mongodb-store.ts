import type {
  CreateResult,
  FilterType,
  FindOptions,
  PartialResult,
  PhysicalStore,
  WithOptionalId,
} from '@furystack/core'
import type { Constructable } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { Collection, Filter, MongoClient, OptionalUnlessRequiredId, Sort, UpdateFilter } from 'mongodb'
import { ObjectId } from 'mongodb'
import { Lock } from 'semaphore-async-await'

/**
 * TypeORM Store implementation for FuryStack
 */
export class MongodbStore<
    T extends object,
    TPrimaryKey extends keyof T,
    TWriteableData = WithOptionalId<T, TPrimaryKey>,
  >
  extends EventHub<{
    onEntityAdded: { entity: T }
    onEntityUpdated: { id: T[TPrimaryKey]; change: Partial<T> }
    onEntityRemoved: { key: T[TPrimaryKey] }
  }>
  implements PhysicalStore<T, TPrimaryKey, TWriteableData>
{
  public readonly primaryKey: TPrimaryKey

  public readonly model: Constructable<T>

  private initLock = new Lock()
  private collection?: Collection<T>

  private createIdFilter(...values: Array<T[TPrimaryKey]>): Filter<T> {
    return {
      [this.primaryKey]: {
        $in: this.primaryKey === '_id' ? values.map((value) => new ObjectId(value as any)) : values,
      },
    } as Filter<T>
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

  private parseFilter(filter?: FilterType<T>): Filter<T> {
    if (!filter) {
      return {}
    }
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
    return filter as Filter<T>
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
      const client = this.options.mongoClient()
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
      mongoClient: () => MongoClient
    },
  ) {
    super()
    this.primaryKey = options.primaryKey
    this.model = options.model
  }
  public async add(...entries: TWriteableData[]): Promise<CreateResult<T>> {
    const collection = await this.getCollection()
    const result = await collection.insertMany(entries.map((e) => ({ ...e }) as any as OptionalUnlessRequiredId<T>))

    const created =
      this.primaryKey === '_id'
        ? Object.values(result.insertedIds).map((insertedId, index) =>
            this.stringifyResultId({ _id: insertedId, ...entries[index] }),
          )
        : (Object.values(result.insertedIds).map((insertedId, index) => {
            const entity = { _id: insertedId, ...entries[index] }
            const { _id, ...r } = entity
            return r
          }) as any as T[])

    created.forEach((entity) => this.emit('onEntityAdded', { entity }))

    return {
      created,
    }
  }
  public async update(id: T[TPrimaryKey], data: Partial<T>): Promise<void> {
    const collection = await this.getCollection()
    const updateResult = await collection.updateOne(this.createIdFilter(id), { $set: data } as UpdateFilter<T>)

    if (updateResult.matchedCount < 1) {
      throw Error(`Entity not found with id '${id}', cannot update!`)
    }
    this.emit('onEntityUpdated', { id, change: data })
  }
  public async count(filter?: FilterType<T>): Promise<number> {
    const collection = await this.getCollection()
    return await collection.countDocuments(this.parseFilter(filter), {})
  }
  public async find<TFields extends Array<keyof T>>(
    filter: FindOptions<T, TFields>,
  ): Promise<Array<PartialResult<T, TFields>>> {
    const collection = await this.getCollection()

    const sort: Sort = filter.order
      ? Object.fromEntries([
          ...Object.keys(filter.order).map((key) => [
            key,
            (filter.order as any)[key] === 'ASC' ? (1 as const) : (-1 as const),
          ]),
        ])
      : {}

    const result = await collection
      .find(this.parseFilter(filter.filter))
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

  public async get(key: T[TPrimaryKey], select?: Array<keyof T>): Promise<T | undefined> {
    const collection = await this.getCollection()
    const projection = this.getProjection(select)
    const result = await collection.findOne(this.createIdFilter(key), {
      projection,
    })
    return result ? this.stringifyResultId(result) : undefined
  }
  public async remove(...keys: Array<T[TPrimaryKey]>): Promise<void> {
    const collection = await this.getCollection()
    await collection.deleteMany(this.createIdFilter(...keys))
    keys.forEach((key) => this.emit('onEntityRemoved', { key }))
  }
  public async [Symbol.asyncDispose]() {
    /** */
  }
}
