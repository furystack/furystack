import type { EventHub } from '@furystack/utils'
import type { Constructable } from './constructable.js'

export const NumberComparisonOperators = ['$gt', '$gte', '$lt', '$lte'] as const

export const StringComparisonOperators = ['$startsWith', '$endsWith', '$like', '$regex'] as const
export const SingleComparisonOperators = ['$eq', '$ne'] as const

export const ArrayComparisonOperators = ['$in', '$nin'] as const
export const LogicalOperators = ['$and', '$not', '$nor', '$or'] as const

export const allOperators = [
  ...SingleComparisonOperators,
  ...NumberComparisonOperators,
  ...ArrayComparisonOperators,
  ...LogicalOperators,
  ...StringComparisonOperators,
] as const

export type FilterType<T> = {
  [K in keyof T]?:
    | (T[K] extends string ? { [SCO in (typeof StringComparisonOperators)[number]]?: T[K] } : never)
    | (T[K] extends number ? { [SCO in (typeof NumberComparisonOperators)[number]]?: T[K] } : never)
    | { [SCO in (typeof SingleComparisonOperators)[number]]?: T[K] }
    | { [ACO in (typeof ArrayComparisonOperators)[number]]?: Array<T[K]> }
} & { [LO in (typeof LogicalOperators)[number]]?: Array<FilterType<T>> }

export const isLogicalOperator = (
  propertyString: string | number | symbol,
): propertyString is (typeof LogicalOperators)[number] =>
  LogicalOperators.includes(propertyString as (typeof LogicalOperators)[number])

export const isOperator = (propertyString: string): propertyString is (typeof allOperators)[number] =>
  allOperators.includes(propertyString as (typeof allOperators)[number])

export interface CreateResult<T> {
  created: T[]
}

export type WithOptionalId<T, TPrimaryKey extends keyof T> = Omit<T, TPrimaryKey> & { [K in TPrimaryKey]?: T[K] }
/**
 * Find query — `top` / `skip` / `order` / `select` / `filter`. Order keys
 * are applied in object-iteration order (primary first, then secondary).
 */
export interface FindOptions<T, TSelect extends Array<keyof T>> {
  top?: number
  skip?: number
  order?: { [P in keyof T]?: 'ASC' | 'DESC' }
  select?: TSelect
  filter?: FilterType<T>
}

export type PartialResult<T, TFields extends Array<keyof T>> = Pick<T, TFields[number]>

/**
 * Returns a copy of `entry` containing only the keys listed in `fields`.
 * Used by store implementations to honour the `select` clause of
 * {@link FindOptions}.
 */
export const selectFields = <T extends object, TField extends Array<keyof T>>(entry: T, ...fields: TField) => {
  const returnValue = {} as PartialResult<T, TField>
  Object.keys(entry).map((key) => {
    const field: TField[number] = key as TField[number]
    if (fields.includes(field)) {
      returnValue[field] = entry[field]
    }
  })
  return returnValue
}

/**
 * The persistence boundary — `add`, `update`, `find`, `get`, `count`,
 * `remove` — implemented by every adapter (`InMemoryStore`,
 * `FileSystemStore`, `MongoDbStore`, `SequelizeStore`, `RedisStore`).
 * Implementations also extend {@link EventHub} so consumers can subscribe to
 * mutation events for in-process replication.
 *
 * **Important:** Application code should not resolve `StoreToken` directly.
 * Writing to a physical store bypasses the `DataSet` layer in
 * `@furystack/repository`, which means authorization callbacks,
 * modification hooks, and entity-sync events are **not** triggered. Use
 * `getDataSetFor(injector, dataSetToken)` from `@furystack/repository`
 * instead — `furystack/no-direct-store-token` enforces this.
 */
export interface PhysicalStore<
  T,
  TPrimaryKey extends keyof T,
  TWriteableData = WithOptionalId<T, TPrimaryKey>,
> extends EventHub<{
  onEntityAdded: { entity: T }
  onEntityUpdated: { id: T[TPrimaryKey]; change: Partial<T> }
  onEntityRemoved: { key: T[TPrimaryKey] }
}> {
  readonly primaryKey: TPrimaryKey
  readonly model: Constructable<T>
  add(...entries: TWriteableData[]): Promise<CreateResult<T>>
  update(id: T[TPrimaryKey], data: Partial<T>): Promise<void>
  count(filter?: FilterType<T>): Promise<number>
  find<TSelect extends Array<keyof T>>(findOptions: FindOptions<T, TSelect>): Promise<Array<PartialResult<T, TSelect>>>
  get<TSelect extends Array<keyof T>>(
    key: T[TPrimaryKey],
    select?: TSelect,
  ): Promise<PartialResult<T, TSelect> | undefined>
  remove(...keys: Array<T[TPrimaryKey]>): Promise<void>
}
