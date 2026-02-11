import type { CacheResult } from './cache-result.js'
import { isLoadedCacheResult } from './cache-result.js'
import { CacheStateManager, CannotObsoleteUnloadedError } from './cache-state-manager.js'

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

  /**
   * The entity will be marked as obsolete after this time has passed since it was last loaded
   */
  staleTimeMs?: number

  /**
   * The entity will be removed from the cache after this time has passed since it was last loaded
   */
  cacheTimeMs?: number
}

export class Cache<TData, TArgs extends any[]> implements Disposable {
  constructor(private readonly options: CacheSettings<TData, TArgs>) {
    this.stateManager = new CacheStateManager<TData, TArgs>({ capacity: this.options.capacity })
  }

  /**
   * Stores in-flight load promises by cache key to deduplicate concurrent loads
   */
  private readonly pendingLoads = new Map<string, Promise<TData>>()

  /**
   * Disposes the cache
   */
  public [Symbol.dispose]() {
    this.pendingLoads.clear()
    this.stateManager[Symbol.dispose]()
  }

  private getIndex = (...args: TArgs) => JSON.stringify(args)

  private readonly stateManager: CacheStateManager<TData, TArgs>

  /**
   * @param args The arguments for getting the entity
   * @returns whether the entity is in the cache
   */
  public has(...args: TArgs) {
    return this.stateManager.has(this.getIndex(...args))
  }

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

    const pending = this.pendingLoads.get(index)
    if (pending) {
      return pending
    }

    const loadPromise = this.loadEntry(index, args)
    this.pendingLoads.set(index, loadPromise)
    loadPromise.then(
      () => this.cleanupPendingLoad(index, loadPromise),
      () => this.cleanupPendingLoad(index, loadPromise),
    )
    return loadPromise
  }

  private cleanupPendingLoad(index: string, promise: Promise<TData>) {
    if (this.pendingLoads.get(index) === promise) {
      this.pendingLoads.delete(index)
    }
  }

  private async loadEntry(index: string, args: TArgs): Promise<TData> {
    try {
      this.stateManager.setLoadingState(index)
      const loaded = await this.options.load(...args)
      this.stateManager.setLoadedState(index, loaded)

      if (this.options.staleTimeMs) {
        setTimeout(() => {
          try {
            this.setObsolete(...args)
          } catch (error) {
            if (!(error instanceof CannotObsoleteUnloadedError)) {
              throw error
            }
          }
        }, this.options.staleTimeMs)
      }

      if (this.options.cacheTimeMs) {
        setTimeout(() => this.remove(...args), this.options.cacheTimeMs)
      }

      return loaded
    } catch (error) {
      this.stateManager.setFailedState(index, error)
      throw error
    }
  }

  /**
   * @param args The arguments for getting the entity
   * @returns The reloaded result
   */
  public async reload(...args: TArgs) {
    const index = this.getIndex(...args)
    const loadPromise = this.reloadEntry(index, args)
    this.pendingLoads.set(index, loadPromise)
    loadPromise.then(
      () => this.cleanupPendingLoad(index, loadPromise),
      () => this.cleanupPendingLoad(index, loadPromise),
    )
    return loadPromise
  }

  private async reloadEntry(index: string, args: TArgs): Promise<TData> {
    try {
      this.stateManager.setLoadingState(index)
      const loaded = await this.options.load(...args)
      this.stateManager.setLoadedState(index, loaded)
      return loaded
    } catch (error) {
      this.stateManager.setFailedState(index, error)
      throw error
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
   * @returns a boolean that indicates whether the entity was present in the cache and was removed
   */
  public remove(...args: TArgs) {
    const index = this.getIndex(...args)
    return this.stateManager.remove(index)
  }

  /**
   * Returns an observable value that will be updated with the state of the entity. Will also trigger a reload if needed.
   * @param args The arguments for getting the entity
   * @returns An observable value that will be updated with the state of the entity
   */
  public getObservable(...args: TArgs) {
    const index = this.getIndex(...args)
    const observable = this.stateManager.getObservable(index)
    if (observable.getValue().status === 'loading' && !this.pendingLoads.has(index)) {
      this.get(...args)
        .then(() => {
          /** */
        })
        .catch(() => {
          /** */
        })
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
  public obsoleteRange(
    callback: (
      /**
       * The entity to check
       */
      entity: TData,
      /**
       * The arguments that resulted to get the specific entity
       */
      args: TArgs,
    ) => boolean,
  ) {
    this.stateManager.obsoleteRange(callback)
  }

  /**
   * Removes specific entities from the cache based on a predicate function.
   * @param callback A callback that will be called for each entity in the cache. If the callback returns true, the entity will be removed from the cache.
   */
  public removeRange(
    callback: (
      /**
       * The entity to check
       */
      entity: TData,
      /**
       * The arguments that resulted to get the specific entity
       */
      args: TArgs,
    ) => boolean,
  ) {
    this.stateManager.removeRange(callback)
  }

  /**
   * Removes all entities from the cache
   */
  public flushAll() {
    this.stateManager.flushAll()
  }
}
