/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Constructable } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { CreateResult, FilterType, FindOptions, PartialResult, PhysicalStore } from './models/physical-store.js'
import { isLogicalOperator, isOperator, selectFields } from './models/physical-store.js'

export class InMemoryStore<T, TPrimaryKey extends keyof T>
  extends EventHub<{
    onEntityAdded: { entity: T }
    onEntityUpdated: { id: T[TPrimaryKey]; change: Partial<T> }
    onEntityRemoved: { key: T[TPrimaryKey] }
  }>
  implements PhysicalStore<T, TPrimaryKey, T>
{
  /**
   *
   * @param keys The keys to remove from the store
   */
  public async remove(...keys: Array<T[TPrimaryKey]>): Promise<void> {
    keys.forEach((key) => {
      this.cache.delete(key)
      this.emit('onEntityRemoved', { key })
    })
  }

  public async add(...entries: T[]): Promise<CreateResult<T>> {
    const created = entries.map((e) => {
      const entry = { ...e }
      if (this.cache.has(entry[this.primaryKey])) {
        throw new Error('Item with the primary key already exists.')
      }
      this.cache.set(entry[this.primaryKey], entry)
      this.emit('onEntityAdded', { entity: entry })
      return entry
    })
    return { created }
  }

  public cache: Map<T[TPrimaryKey], T> = new Map()
  public get = (key: T[TPrimaryKey], select?: Array<keyof T>) => {
    const item = this.cache.get(key)
    return Promise.resolve(item && select ? selectFields(item, ...select) : item)
  }

  private evaluateLike = (value: string, likeString: string) => {
    const likeRegex = `^${likeString.replace(/%/g, '.*')}$`
    return value.match(new RegExp(likeRegex, 'i'))
  }

  private filterInternal(values: T[], filter?: FilterType<T>): T[] {
    if (!filter) {
      return values
    }
    return values.filter((item) => {
      for (const key in filter) {
        if (isLogicalOperator(key)) {
          const filterValue = filter[key] as Array<FilterType<T>>
          switch (key) {
            case '$and':
              if (filterValue.some((v: FilterType<T>) => !this.filterInternal([item], v).length)) {
                return false
              }
              break
            case '$or':
              if (filterValue.some((v: FilterType<T>) => this.filterInternal([item], v).length)) {
                break
              }
              return false
            default:
              throw new Error(`The logical operation '${key}' is not a valid operation`)
          }
        } else if (typeof (filter as any)[key] === 'object') {
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
                case '$lt':
                  if (itemValue < filterValue) {
                    break
                  }
                  return false
                case '$lte':
                  if (itemValue <= filterValue) {
                    break
                  }
                  return false
                case '$gt':
                  if (itemValue > filterValue) {
                    break
                  }
                  return false
                case '$gte':
                  if (itemValue >= filterValue) {
                    break
                  }
                  return false
                case '$regex':
                  if (!new RegExp(filterValue as string).test((itemValue as string).toString())) {
                    return false
                  }
                  break
                case '$startsWith':
                  if (!itemValue.startsWith(filterValue)) {
                    return false
                  }
                  break
                case '$endsWith':
                  if (!itemValue.endsWith(filterValue)) {
                    return false
                  }
                  break
                case '$like':
                  if (!this.evaluateLike(itemValue as string, filterValue as string)) {
                    return false
                  }
                  break
                default:
                  throw new Error(`The expression (${filterKey}) is not supported by '${this.constructor.name}'!`)
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
    let value: Array<PartialResult<T, TFields>> = this.filterInternal([...this.cache.values()], searchOptions.filter)

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

  public async update(id: T[TPrimaryKey], data: T) {
    if (!this.cache.has(id)) {
      throw Error(`Entity not found with id '${id as string}', cannot update!`)
    }
    this.cache.set(id, {
      ...this.cache.get(id),
      ...data,
    })
    this.emit('onEntityUpdated', { id, change: data })
  }

  public [Symbol.dispose]() {
    this.cache.clear()
    super[Symbol.dispose]()
  }

  public readonly primaryKey: TPrimaryKey
  public readonly model: Constructable<T>

  /**
   * Creates an InMemoryStore that can be used for testing purposes.
   * @param options Options for the In Memory Store
   * @param options.primaryKey The name of the primary key field
   * @param options.model The Entity Model
   */
  constructor(options: {
    /**
     * The name of the Primary Key property
     */
    primaryKey: TPrimaryKey
    /**
     * The model constructor
     */
    model: Constructable<T>
  }) {
    super()
    this.primaryKey = options.primaryKey
    this.model = options.model
  }
}
