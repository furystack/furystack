import type { Disposable } from '@furystack/utils'
import { CacheLockManager } from './cache-lock-manager'
import { CacheStateManager } from './cache-state-manager'

export class Cache<TData, TArgs extends any[]> implements Disposable {
  private readonly cacheLockManager = new CacheLockManager()
  public dispose() {
    this.cacheLockManager.dispose()
    this.store.clear()
    this.stateManager.dispose()
  }

  private getIndex = (...args: TArgs) => JSON.stringify(args)

  public readonly store = new Map<string, TData>()

  public readonly stateManager = new CacheStateManager<TData>()

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
    try {
      await this.cacheLockManager.acquireLock(index)
      const newCached = this.store.get(index)
      if (newCached) {
        return newCached
      }
      const loaded = await this.load(...args)
      this.store.set(index, loaded)
      return loaded
    } catch (error) {
      this.stateManager.setFailedState(index, error)
      throw error
    } finally {
      this.cacheLockManager.releaseLock(index)
    }
  }

  public async invalidate(...args: TArgs) {
    const index = this.getIndex(...args)
    this.store.delete(index)
  }

  constructor(private readonly load: (...args: TArgs) => Promise<TData>) {}
}
