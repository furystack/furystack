import { Constructable } from '@furystack/inject'
import {
  PhysicalStore,
  FindOptions,
  selectFields,
  PartialResult,
  FilterType,
  isOperator,
} from './models/physical-store'

export class InMemoryStore<T> implements PhysicalStore<T> {
  /**
   *
   * @param keys The keys to remove from the store
   */
  public async remove(...keys: Array<T[this['primaryKey']]>): Promise<void> {
    keys.map((key) => this.cache.delete(key))
  }

  public async add(...entries: T[]): Promise<void> {
    entries.map((entry) => {
      if (this.cache.has(entry[this.primaryKey])) {
        throw new Error('Item with the primary key already exists.')
      }
      this.cache.set(entry[this.primaryKey], entry)
    })
  }

  public cache: Map<T[this['primaryKey']], T> = new Map()
  public get = async (key: T[this['primaryKey']]) => this.cache.get(key)

  private filterInternal(values: T[], filter?: FilterType<T>): T[] {
    if (!filter) {
      return values
    }
    return values.filter((item) => {
      for (const key in filter) {
        if (typeof (filter as any)[key] === 'object') {
          for (const filterKey in (filter as any)[key]) {
            if (isOperator(filterKey)) {
              const itemValue = (item as any)[key]
              const filterValue = (filter as any)[key][filterKey]
              switch (filterKey) {
                case '$eq':
                  if (filterValue !== itemValue) {
                    return false
                  }
                  break
                case '$ne':
                  if (filterValue === itemValue) {
                    return false
                  }
                  break
                case '$in':
                  if (!filterValue.includes(itemValue)) {
                    return false
                  }
                  break

                case '$nin':
                  if (filterValue.includes(itemValue)) {
                    return false
                  }
                  break
                case '$regex':
                  if (!new RegExp(filterValue).test((itemValue as any).toString())) {
                    return false
                  }
                  break
                default:
                  throw new Error(`The expression (${key}) is not supported by '${this.constructor.name}'!`)
              }
            } else {
              throw new Error(`The filter key '${filterKey}' is not a valid operation`)
            }
          }
        } else {
          throw new Error(`The filter has to be an object, got ${typeof (filter as any)[key]} for field '${key}'`)
        }
      }
      return true
    })
  }

  public async find<TFields extends Array<keyof T>>(searchOptions: FindOptions<T, TFields>) {
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
      value = value.map((item) => {
        return selectFields(item, ...(searchOptions.select as TFields))
      })
    }

    return value
  }

  public async count(filter?: FilterType<T>) {
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
   *
   * @param options Options for the In Memory Store
   * @param options.primaryKey
   * @param options.model
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
