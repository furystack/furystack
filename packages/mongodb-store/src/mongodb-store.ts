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

// Improved type safety for hasObjectId
const hasObjectId = <T extends { _id?: unknown }>(value: T): value is T & { _id: ObjectId } => {
  return value && typeof value === 'object' && value._id instanceof ObjectId
}

/**
 * MongoDB Store implementation for FuryStack
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
  private initPromise: Promise<Collection<T>> | null = null
  private collection?: Collection<T>

  private createIdFilter(...values: Array<T[TPrimaryKey]>): Filter<T> {
    // If primaryKey is _id, convert string values to ObjectId
    return {
      [this.primaryKey]: {
        $in: this.primaryKey === '_id' ? values.map((value) => new ObjectId(value as string)) : values,
      },
    } as Filter<T>
  }

  private stringifyResultId(item: T): T {
    // If _id is ObjectId, convert to string
    if (this.primaryKey === '_id' && hasObjectId(item)) {
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
    // Only handle _id conversion if present
    if (Object.prototype.hasOwnProperty.call(filter, '_id')) {
      const f = { ...filter } as Record<string, unknown>
      if (typeof f._id === 'string') {
        f._id = new ObjectId(f._id)
      } else if (typeof f._id === 'object' && f._id !== null) {
        const idObj = f._id as Record<string, unknown>
        if (idObj.$eq && typeof idObj.$eq === 'string') {
          idObj.$eq = new ObjectId(idObj.$eq)
        }
        if (Array.isArray(idObj.$in)) {
          idObj.$in = idObj.$in.map((id: string) => new ObjectId(id))
        }
        if (Array.isArray(idObj.$nin)) {
          idObj.$nin = idObj.$nin.map((id: string) => new ObjectId(id))
        }
      }
      return f as Filter<T>
    }
    return filter as Filter<T>
  }

  public async getCollection(): Promise<Collection<T>> {
    if (this.collection) {
      return this.collection
    }
    if (!this.initPromise) {
      this.initPromise = this.initializeCollection()
    }
    return this.initPromise
  }

  private async initializeCollection(): Promise<Collection<T>> {
    try {
      const client = this.options.mongoClient()
      const collection = client.db(this.options.db).collection<T>(this.options.collection)
      if (this.primaryKey !== '_id') {
        await collection.createIndex({ [this.primaryKey]: 1 }, { unique: true })
      }
      this.collection = collection
      return collection
    } catch (error) {
      this.initPromise = null
      throw error
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
    const result = await collection.insertMany(entries.map((e) => ({ ...e }) as OptionalUnlessRequiredId<T>))
    const created =
      this.primaryKey === '_id'
        ? Object.values(result.insertedIds).map((insertedId, index) =>
            // Use 'unknown' as intermediate cast to satisfy TypeScript
            this.stringifyResultId({ _id: insertedId, ...entries[index] } as unknown as T),
          )
        : Object.values(result.insertedIds).map((insertedId, index) => {
            // Use 'unknown' as intermediate cast to satisfy TypeScript
            const entity = { _id: insertedId, ...entries[index] } as unknown as T & { _id: unknown }
            const { _id, ...r } = entity
            return r as T
          })
    created.forEach((entity) => this.emit('onEntityAdded', { entity }))
    return { created }
  }

  public async update(id: T[TPrimaryKey], data: Partial<T>): Promise<void> {
    const collection = await this.getCollection()
    const updateResult = await collection.updateOne(this.createIdFilter(id), { $set: data } as UpdateFilter<T>)
    if (updateResult.matchedCount < 1) {
      throw Error(`Entity not found with id '${String(id)}', cannot update!`)
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
      ? Object.fromEntries(Object.entries(filter.order).map(([key, value]) => [key, value === 'ASC' ? 1 : -1]))
      : {}
    const result = await collection
      .find(this.parseFilter(filter.filter))
      .project(this.getProjection(filter.select))
      .skip(filter.skip || 0)
      .limit(filter.top || Number.MAX_SAFE_INTEGER)
      .sort(sort)
      .toArray()
    return result.map((entity) => this.stringifyResultId(entity as T))
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
    const result = await collection.findOne(this.createIdFilter(key), { projection })
    return result ? this.stringifyResultId(result as T) : undefined
  }

  public async remove(...keys: Array<T[TPrimaryKey]>): Promise<void> {
    const collection = await this.getCollection()
    await collection.deleteMany(this.createIdFilter(...keys))
    keys.forEach((key) => this.emit('onEntityRemoved', { key }))
  }
}
