import { Constructable } from '@furystack/inject'
import { DefaultFilter, IPhysicalStore } from './Models/IPhysicalStore'

/**
 * Store implementation that stores data in an in-memory cache
 */
export class InMemoryStore<T> implements IPhysicalStore<T, Partial<T>> {
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

  public filter = async (filter: DefaultFilter<T>) => {
    const { order, select, skip, top, ...filterFields } = filter
    return [...this.cache.values()].filter(item => {
      for (const key in filterFields) {
        if ((filterFields as any)[key] !== (item as any)[key]) {
          return false
        }
      }
      return true
    })
  }

  public async count() {
    return this.cache.size
  }

  public async update(id: T[this['primaryKey']], data: T) {
    this.cache.set(id, data)
  }

  public dispose() {
    /** */
  }

  public readonly primaryKey: keyof T
  public tickMs = 10000
  public readonly model: Constructable<T>

  constructor(options: { primaryKey: keyof T; tickMs?: number; model: Constructable<T> }) {
    this.primaryKey = options.primaryKey
    options.tickMs && (this.tickMs = options.tickMs)
    this.model = options.model
  }
}
