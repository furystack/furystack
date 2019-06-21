import { Constructable } from '@furystack/inject'
import { Disposable } from '@sensenet/client-utils'

/**
 * Type for default filtering model
 */
export interface DefaultFilter<T> {
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
  select?: Array<keyof T>

  /**
   * The fields should match this filter
   */
  filter?: Partial<T>
}

/**
 * Interface that defines a physical store implementation
 */
export interface PhysicalStore<T, TFilter = DefaultFilter<T>> extends Disposable {
  /**
   * The Primary key field name
   */
  readonly primaryKey: keyof T

  /**
   * A constructable model
   */
  readonly model: Constructable<T>

  /**
   * Adds an entry to the store, returns a promise that will be resolved with the added data
   * @param data The data to be added
   */
  add(data: T): Promise<T>

  /**
   * Updates an entry in the store, returns a promise that will be resolved once the update is done
   * @param id The primary key of the entry
   * @param data The data to be updated
   */
  update(id: T[this['primaryKey']], data: T): Promise<void>

  /**
   * Returns a promise that will be resolved with the count of the elements
   */
  count(): Promise<number>

  /**
   * Returns a promise that will be resolved with an array of elements that matches the filter
   * @param filter The Filter value
   */
  filter(filter: TFilter): Promise<T[]>

  /**
   * Returns a promise that will be resolved with an entry with the defined primary key or undefined
   * @param key The primary key of the entry
   */
  get(key: T[this['primaryKey']]): Promise<T | undefined>

  /**
   * Removes an entry with the defined primary key. Returns a promise that will be resolved once the operation is completed
   * @param key The primary key of the entry to remove
   */
  remove(key: T[this['primaryKey']]): Promise<void>
}
