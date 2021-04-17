import { Constructable } from '@furystack/inject'
import { Disposable } from '@furystack/utils'

export const NumberComparisonOperators = ['$gt', '$gte', '$lt', '$lte'] as const
export const SingleComparisonOperators = ['$eq', '$ne'] as const

export const ArrayComparisonOperators = ['$in', '$nin'] as const
export const LogicalOperators = ['$and', '$not', '$nor', '$or'] as const

export const allOperators = [
  ...SingleComparisonOperators,
  ...NumberComparisonOperators,
  ...ArrayComparisonOperators,
  ...LogicalOperators,
  '$regex',
] as const

export type FilterType<T> = {
  [K in keyof T]?:
    | (T[K] extends string ? { $regex?: string } : never)
    | (T[K] extends number ? { [SCO in typeof NumberComparisonOperators[number]]?: T[K] } : never)
    | { [SCO in typeof SingleComparisonOperators[number]]?: T[K] }
    | { [ACO in typeof ArrayComparisonOperators[number]]?: Array<T[K]> }
} &
  { [LO in typeof LogicalOperators[number]]?: Array<FilterType<T>> }
export const isOperator = (propertyString: string): propertyString is typeof allOperators[number] =>
  allOperators.includes(propertyString as typeof allOperators[number])

export const t: FilterType<{ a: number; b: string; c: boolean }> = {
  a: { $eq: 3 },
  b: { $in: ['a', 'b', 'c'] },
  $and: [{ a: { $eq: 2 } }],
}

export interface CreateResult<T> {
  created: T[]
}

export type WithOptionalId<T, TPrimaryKey> = TPrimaryKey extends keyof T ? Omit<T, TPrimaryKey> & Partial<T> : T

/**
 * Type for default filtering model
 */
export interface FindOptions<T, TSelect extends Array<keyof T>> {
  /**
   * Limits the hits
   */
  top?: number

  /**
   * Skips the first N hit
   */
  skip?: number

  /**
   * Sets up an order by a field and a direction
   */
  order?: { [P in keyof T]?: 'ASC' | 'DESC' }

  /**
   * The result set will be limited to these fields
   */
  select?: TSelect

  /**
   * The fields should match this filter
   */
  filter?: FilterType<T>
}

export type PartialResult<T, TFields extends Array<keyof T>> = Pick<T, TFields[number]>

export const selectFields = <T, TField extends Array<keyof T>>(entry: T, ...fields: TField) => {
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
 * Interface that defines a physical store implementation
 */
export interface PhysicalStore<T, TPrimaryKey extends keyof T> extends Disposable {
  /**
   * The Primary key field name
   */
  readonly primaryKey: TPrimaryKey

  /**
   * A constructable model
   */
  readonly model: Constructable<T>

  /**
   * Adds an entry to the store, returns a promise that will be resolved with the added data
   *
   * @param entries The data to be added
   */
  add(...entries: Array<WithOptionalId<T, TPrimaryKey>>): Promise<CreateResult<T>>

  /**
   * Updates an entry in the store, returns a promise that will be resolved once the update is done
   *
   * @param id The primary key of the entry
   * @param data The data to be updated
   */
  update(id: T[TPrimaryKey], data: Partial<T>): Promise<void>

  /**
   * Returns a promise that will be resolved with the count of the elements
   */
  count(filter?: FilterType<T>): Promise<number>

  /**
   * Returns a promise that will be resolved with an array of elements that matches the filter
   *
   * @param searchOptions An options object for the Search expression
   */
  find<TSelect extends Array<keyof T>>(findOptions: FindOptions<T, TSelect>): Promise<Array<PartialResult<T, TSelect>>>

  /**
   * Returns a promise that will be resolved with an entry with the defined primary key or undefined
   *
   * @param key The primary key of the entry
   */
  get<TSelect extends Array<keyof T>>(
    key: T[TPrimaryKey],
    select?: TSelect,
  ): Promise<PartialResult<T, TSelect> | undefined>

  /**
   * Removes an entry with the defined primary key. Returns a promise that will be resolved once the operation is completed
   *
   * @param key The primary key of the entry to remove
   */
  remove(...keys: Array<T[TPrimaryKey]>): Promise<void>
}
