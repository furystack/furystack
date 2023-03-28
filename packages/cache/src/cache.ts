import type { Disposable } from '@furystack/utils'
import { CacheLockManager } from './cache-lock-manager'
import { CacheStateManager } from './cache-state-manager'
import { isLoadedCacheResult } from './cache-result'

interface CacheSettings<TData, TArgs extends any[]> {
  /**
   *  Callback to retrieve the uncached entity
   *
   * @param args The arguments for getting the entity
   * @returns A promise that resolves with the loaded entity
   */
  load: (...args: TArgs) => Promise<TData>

  /**
   * The maximum number of entities to store in the cache. The oldest will be removed when the limit is reached.
   */
  capacity?: number
}

export class Cache<TData, TArgs extends any[]> implements Disposable {
  private readonly cacheLockManager = new CacheLockManager()

  /**
   * Disposes the cache
   */
  public dispose() {
    this.cacheLockManager.dispose()
    this.stateManager.dispose()
  }

  private getIndex = (...args: TArgs) => JSON.stringify(args)

  private readonly stateManager = new CacheStateManager<TData>({ capacity: this.options.capacity })

  /**
   * Method that returns the entity from the cache - or loads it if it's not in the cache
   *
   * @param args The arguments for getting the entity
   * @returns The loaded result
   */
  public async get(...args: TArgs): Promise<TData> {
    const index = this.getIndex(...args)

    const observable = this.stateManager.getObservable(index)

    const fromCache = observable.getValue()
    if (fromCache && isLoadedCacheResult(fromCache)) {
      return fromCache.value
    }
    try {
      await this.cacheLockManager.acquireLock(index)
      const newCached = observable.getValue()
      if (isLoadedCacheResult(newCached)) {
        return newCached.value
      }
      this.stateManager.setPendingState(index)
      const loaded = await this.options.load(...args)
      this.stateManager.setLoadedState(index, loaded)
      return loaded
    } catch (error) {
      this.stateManager.setFailedState(index, error)
      throw error
    } finally {
      this.cacheLockManager.releaseLock(index)
    }
  }

  /**
   * Sets the entity as obsolete
   *
   * @param args The arguments for getting the entity
   * @returns The obsolete result
   */
  public setObsolete(...args: TArgs) {
    const index = this.getIndex(...args)
    return this.stateManager.setObsoleteState(index)
  }

  public remove(...args: TArgs) {
    const index = this.getIndex(...args)
    this.stateManager.remove(index)
  }

  public getObservable(...args: TArgs) {
    const index = this.getIndex(...args)
    this.get(...args) // Trigger reload if needed
    return this.stateManager.getObservable(index)
  }

  public getCount() {
    return this.stateManager.getCount()
  }

  constructor(private readonly options: CacheSettings<TData, TArgs>) {}
}
