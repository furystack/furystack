import Semaphore from 'semaphore-async-await'
import type { Disposable } from '@furystack/utils'

export class Cache<TData, TArgs extends any[]> implements Disposable {
  public dispose() {
    this.locks.clear()
    this.store.clear()
  }

  /**
   * Stores the locks by their keys to prevent parallel loading issues
   */
  public readonly locks = new Map<string, Semaphore>()

  private getLock(index: string) {
    const fromLocks = this.locks.get(index)
    if (fromLocks) {
      return fromLocks
    }
    const lock = new Semaphore(1)
    this.locks.set(index, lock)
    return lock
  }

  private getIndex = (...args: TArgs) => JSON.stringify(args)

  public readonly store = new Map<string, TData>()

  /**
   * @param args The arguments for getting the entity
   * @returns The object instance
   */
  public async get(...args: TArgs): Promise<TData> {
    const index = this.getIndex(...args)

    const fromCache = this.store.get(index)
    if (fromCache) {
      return fromCache
    }
    const semaphore = this.getLock(index)
    try {
      await semaphore.acquire()
      const newCached = this.store.get(index)
      if (newCached) {
        return newCached
      }
      const loaded = await this.load(...args)
      this.store.set(index, loaded)
      return loaded
    } finally {
      semaphore.release()
    }
  }

  constructor(private readonly load: (...args: TArgs) => Promise<TData>) {}
}
