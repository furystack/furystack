import type { Disposable } from '@furystack/utils'
import { CacheLockManager } from './cache-lock-manager.js'
import { CacheStateManager } from './cache-state-manager.js'
import { CacheResult, isLoadedCacheResult, isPendingCacheResult } from './cache-result.js'

interface CacheSettings<TData, TArgs extends any[]> {
  /**
   *  Callback to retrieve the uncached entity
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
      this.stateManager.setLoadingState(index)
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
   *
   * @param args The arguments for getting the entity
   * @returns The reloaded result
   */
  public async reload(...args: TArgs) {
    const index = this.getIndex(...args)
    try {
      await this.cacheLockManager.acquireLock(index)
      this.stateManager.setLoadingState(index)
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
   * Sets an explicit value for the entity in the cache
   * @param param0 The Options for setting the entity
   * @param param0.loadArgs The arguments for getting the entity
   * @param param0.value The value to set (with state)
   */
  public setExplicitValue({ loadArgs, value }: { loadArgs: TArgs; value: CacheResult<TData> }) {
    const index = this.getIndex(...loadArgs)
    this.stateManager.setValue(index, value)
  }

  /**
   * Sets the entity as obsolete
   * @param args The arguments for getting the entity
   * @returns The obsolete result
   */
  public setObsolete(...args: TArgs) {
    const index = this.getIndex(...args)
    return this.stateManager.setObsoleteState(index)
  }

  /**
   * Removes an entity from the cache
   * @param args The arguments for getting the entity
   */
  public remove(...args: TArgs) {
    const index = this.getIndex(...args)
    this.stateManager.remove(index)
  }

  /**
   * Returns an observable value that will be updated with the state of the entity. Will also trigger a reload if needed.
   * @param args The arguments for getting the entity
   * @returns An observable value that will be updated with the state of the entity
   */
  public getObservable(...args: TArgs) {
    const index = this.getIndex(...args)
    const observable = this.stateManager.getObservable(index)
    if (isPendingCacheResult(observable.getValue())) {
      this.get(...args) // Trigger reload if needed
    }
    return observable
  }

  /**
   * @returns The number of entities in the cache
   */
  public getCount() {
    return this.stateManager.getCount()
  }

  /**
   * Marks specific entities in the cache as obsolete based on a predicate function.
   * @param callback A callback that will be called for each entity in the cache. If the callback returns true, the entity will be marked as obsolete.
   */
  public obsoleteRange(callback: (entity: TData) => boolean) {
    this.stateManager.obsoleteRange(callback)
  }

  /**
   * Removes specific entities from the cache based on a predicate function.
   * @param callback A callback that will be called for each entity in the cache. If the callback returns true, the entity will be removed from the cache.
   */
  public removeRange(callback: (entity: TData) => boolean) {
    this.stateManager.removeRange(callback)
  }

  /**
   * Removes all entities from the cache
   */
  public flushAll() {
    this.stateManager.flushAll()
  }

  constructor(private readonly options: CacheSettings<TData, TArgs>) {}
}
