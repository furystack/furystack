import { Constructable } from '@furystack/inject'
import { PhysicalStore, SearchOptions, selectFields } from './Models/PhysicalStore'

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

  public async search<TFields extends Array<keyof T>>(filter: SearchOptions<T, TFields>) {
    let value = [...this.cache.values()].filter(item => {
      for (const key in filter.filter) {
        if ((filter.filter as any)[key] !== (item as any)[key]) {
          return false
        }
      }
      return true
    })

    if (filter.order) {
      // ToDo
    }

    if (filter.top || filter.skip) {
      value = value.slice(filter.skip, (filter.skip || 0) + (filter.top || 0))
    }

    if (filter.select !== undefined) {
      value = value.map(item => {
        return selectFields(item, ...(filter.select as Array<keyof T>))
      })
    }

    return value
  }

  public async count() {
    return this.cache.size
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
