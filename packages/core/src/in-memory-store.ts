import { Constructable } from '@furystack/inject'
import { PhysicalStore, SearchOptions, selectFields, PartialResult } from './models/physical-store'

/**
 * Store implementation that stores data in an in-memory cache
 */
export class InMemoryStore<T> implements PhysicalStore<T> {
  public async remove(key: T[this['primaryKey']]): Promise<void> {
    this.cache.delete(key)
  }

  public async add(data: T): Promise<T> {
    if (this.cache.has(data[this.primaryKey])) {
      throw new Error('Item with the primary key already exists.')
    }
    this.cache.set(data[this.primaryKey], data)
    return data
  }

  private cache: Map<T[this['primaryKey']], T> = new Map()
  public get = async (key: T[this['primaryKey']]) => this.cache.get(key)

  private filterInternal(values: T[], filter?: Partial<T>): T[] {
    if (!filter) {
      return values
    }
    return values.filter(item => {
      for (const key in filter) {
        if ((filter as any)[key] !== (item as any)[key]) {
          return false
        }
      }
      return true
    })
  }

  public async search<TFields extends Array<keyof T>>(filter: SearchOptions<T, TFields>) {
    let value: Array<PartialResult<T, TFields[number]>> = this.filterInternal([...this.cache.values()], filter.filter)

    if (filter.order) {
      for (const fieldName of Object.keys(filter.order) as Array<keyof T>) {
        value = value.sort((a, b) => {
          const order = (filter.order as any)[fieldName] as 'ASC' | 'DESC'
          if (a[fieldName] < b[fieldName]) return order === 'ASC' ? -1 : 1
          if (a[fieldName] > b[fieldName]) return order === 'ASC' ? 1 : -1
          return 0
        })
      }
    }

    if (filter.top || filter.skip) {
      value = value.slice(filter.skip, (filter.skip || 0) + (filter.top || this.cache.size))
    }

    if (filter.select) {
      value = value.map(item => {
        return selectFields(item, ...(filter.select as TFields))
      })
    }

    return value
  }

  public async count(filter?: Partial<T>) {
    return this.filterInternal([...this.cache.values()], filter).length
  }

  public async update(id: T[this['primaryKey']], data: T) {
    this.cache.set(id, {
      ...this.cache.get(id),
      ...data,
    })
  }

  public dispose() {
    this.cache.clear()
  }

  public readonly primaryKey: keyof T
  public readonly model: Constructable<T>

  /**
   * Creates an InMemoryStore that can be used for testing purposes.
   * @param options Options for the In Memory Store
   */
  constructor(options: {
    /**
     * The name of the Primary Key property
     */
    primaryKey: keyof T
    /**
     * The model constructor
     */
    model: Constructable<T>
  }) {
    this.primaryKey = options.primaryKey
    this.model = options.model
  }
}
