import { Constructable } from '@furystack/inject'
import {
  PhysicalStore,
  SearchOptions,
  selectFields,
  PartialResult,
  FilterType,
  isOperator,
} from './models/physical-store'

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

  public cache: Map<T[this['primaryKey']], T> = new Map()
  public get = async (key: T[this['primaryKey']]) => this.cache.get(key)

  private filterInternal(values: T[], filter?: FilterType<T>): T[] {
    if (!filter) {
      return values
    }
    return values.filter(item => {
      for (const key in filter) {
        if (typeof filter[key] === 'object') {
          for (const filterKey in filter[key]) {
            if (isOperator(filterKey)) {
              switch (filterKey) {
                case '$in':
                  return (filter as any)[key][filterKey].includes(item[key])
                default:
                  throw new Error(`The expression (${key}) is not supported by '${this.constructor.name}'!`)
              }
            }
          }
        }
        if (filter[key] !== item[key]) {
          return false
        }
      }
      return true
    })
  }

  public async search<TFields extends Array<keyof T>>(searchOptions: SearchOptions<T, TFields>) {
    let value: Array<PartialResult<T, TFields[number]>> = this.filterInternal(
      [...this.cache.values()],
      searchOptions.filter,
    )

    if (searchOptions.order) {
      for (const fieldName of Object.keys(searchOptions.order) as Array<keyof T>) {
        value = value.sort((a, b) => {
          const order = (searchOptions.order as any)[fieldName] as 'ASC' | 'DESC'
          if (a[fieldName] < b[fieldName]) return order === 'ASC' ? -1 : 1
          if (a[fieldName] > b[fieldName]) return order === 'ASC' ? 1 : -1
          return 0
        })
      }
    }

    if (searchOptions.top || searchOptions.skip) {
      value = value.slice(searchOptions.skip, (searchOptions.skip || 0) + (searchOptions.top || this.cache.size))
    }

    if (searchOptions.select) {
      value = value.map(item => {
        return selectFields(item, ...(searchOptions.select as TFields))
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
