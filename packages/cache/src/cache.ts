import { EventHub, type ListenerErrorPayload, type ObservableValue } from '@furystack/utils'
import type { CacheResult } from './cache-result.js'
import { isLoadedCacheResult } from './cache-result.js'
import { CacheStateManager, CannotObsoleteUnloadedError } from './cache-state-manager.js'

export interface CacheSettings<TData, TArgs extends any[]> {
  /** Loader invoked on cache miss. Concurrent calls for the same key are deduplicated. */
  load: (...args: TArgs) => Promise<TData>

  /** Maximum number of entries. Oldest entry is evicted (LRU) when exceeded. */
  capacity?: number

  /** Entry is marked `'obsolete'` this many ms after a successful load. */
  staleTimeMs?: number

  /** Entry is removed from the cache this many ms after a successful load. */
  cacheTimeMs?: number

  /**
   * Stable cache-key resolver. Defaults to `JSON.stringify(args)` —
   * sufficient for primitives + plain objects, unusable for non-serializable
   * args (e.g. `IncomingMessage`). Override when only a subset of the args
   * should participate in cache lookup.
   *
   * **Note:** the predicates passed to {@link Cache.obsoleteRange} and
   * {@link Cache.removeRange} receive the `args` reference from the most
   * recent `get` / `reload` / `setExplicitValue` call for that entry. Do
   * not mutate the args object after caching; clone if you need a snapshot.
   */
  getKey?: (...args: TArgs) => string
}

/**
 * Async loader cache with state-machine semantics ({@link CacheResult}),
 * concurrent-load deduplication, optional LRU capacity, and stale + cache
 * TTL timers. Extends {@link EventHub} with `onLoadError` and emits the
 * inherited `onListenerError`.
 *
 * @example
 * ```ts
 * using(new Cache({ load: (id: string) => fetchUser(id), staleTimeMs: 30_000 }), (cache) => {
 *   const obs = cache.getObservable('alice')
 *   obs.subscribe((state) => render(state))
 * })
 * ```
 */
export class Cache<TData, TArgs extends any[]>
  extends EventHub<{
    onLoadError: { args: TArgs; error: unknown }
    onListenerError: ListenerErrorPayload
  }>
  implements Disposable
{
  constructor(private readonly options: CacheSettings<TData, TArgs>) {
    super()
    this.stateManager = new CacheStateManager<TData, TArgs>({ capacity: this.options.capacity })
  }

  private readonly pendingLoads = new Map<string, Promise<TData>>()

  private readonly timers = new Map<string, Array<ReturnType<typeof setTimeout>>>()

  public [Symbol.dispose]() {
    this.pendingLoads.clear()
    for (const timerIds of this.timers.values()) {
      for (const id of timerIds) {
        clearTimeout(id)
      }
    }
    this.timers.clear()
    this.stateManager[Symbol.dispose]()
    super[Symbol.dispose]()
  }

  private getIndex = (...args: TArgs) => (this.options.getKey ? this.options.getKey(...args) : JSON.stringify(args))

  private readonly stateManager: CacheStateManager<TData, TArgs>

  public has(...args: TArgs) {
    return this.stateManager.has(this.getIndex(...args))
  }

  /**
   * Returns the cached value, or loads it via {@link CacheSettings.load}.
   * Concurrent calls for the same key share one in-flight promise.
   */
  public async get(...args: TArgs): Promise<TData> {
    const index = this.getIndex(...args)

    const observable = this.stateManager.getObservable(index, args)

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

  private clearTimers(index: string) {
    const existing = this.timers.get(index)
    if (existing) {
      for (const id of existing) {
        clearTimeout(id)
      }
    }
    this.timers.delete(index)
  }

  private setupTimers(index: string, args: TArgs) {
    this.clearTimers(index)

    const timerIds: Array<ReturnType<typeof setTimeout>> = []

    if (this.options.staleTimeMs) {
      timerIds.push(
        setTimeout(() => {
          try {
            this.setObsolete(...args)
          } catch (error) {
            if (!(error instanceof CannotObsoleteUnloadedError)) {
              throw error
            }
          }
        }, this.options.staleTimeMs),
      )
    }

    if (this.options.cacheTimeMs) {
      timerIds.push(setTimeout(() => this.remove(...args), this.options.cacheTimeMs))
    }

    if (timerIds.length) {
      this.timers.set(index, timerIds)
    }
  }

  private async loadEntry(index: string, args: TArgs): Promise<TData> {
    try {
      this.stateManager.setLoadingState(index, args)
      const loaded = await this.options.load(...args)
      this.stateManager.setLoadedState(index, args, loaded)
      this.setupTimers(index, args)
      return loaded
    } catch (error) {
      this.stateManager.setFailedState(index, args, error)
      throw error
    }
  }

  /** Forces a fresh load for `args` regardless of current state. */
  public async reload(...args: TArgs) {
    const index = this.getIndex(...args)
    const loadPromise = this.loadEntry(index, args)
    this.pendingLoads.set(index, loadPromise)
    loadPromise.then(
      () => this.cleanupPendingLoad(index, loadPromise),
      () => this.cleanupPendingLoad(index, loadPromise),
    )
    return loadPromise
  }

  /**
   * Writes `value` directly into the entry for `loadArgs`, bypassing
   * {@link CacheSettings.load}. When `value.status === 'loaded'` the stale
   * and cache TTL timers are (re-)armed — same as a successful
   * {@link Cache.get} / {@link Cache.reload}. Other statuses leave timers
   * untouched.
   */
  public setExplicitValue({ loadArgs, value }: { loadArgs: TArgs; value: CacheResult<TData> }) {
    const index = this.getIndex(...loadArgs)
    this.stateManager.setValue(index, loadArgs, value)
    if (isLoadedCacheResult(value)) {
      this.setupTimers(index, loadArgs)
    }
  }

  /** Transitions a `loaded` entry to `obsolete`. Throws on unloaded entries. */
  public setObsolete(...args: TArgs) {
    const index = this.getIndex(...args)
    return this.stateManager.setObsoleteState(index, args)
  }

  /** Removes the entry. Returns `true` when an entry was present. */
  public remove(...args: TArgs) {
    const index = this.getIndex(...args)
    this.clearTimers(index)
    return this.stateManager.remove(index)
  }

  /**
   * Returns the {@link ObservableValue} backing the entry's state. Triggers
   * a load when the entry is in `'loading'` state with no in-flight promise
   * — load failures emit `onLoadError` rather than rejecting.
   */
  public getObservable(...args: TArgs) {
    const index = this.getIndex(...args)
    const observable = this.stateManager.getObservable(index, args)
    if (observable.getValue().status === 'loading' && !this.pendingLoads.has(index)) {
      this.get(...args)
        .then(() => {
          /** */
        })
        .catch((error) => {
          this.emit('onLoadError', { args, error })
        })
    }
    return observable
  }

  public getCount() {
    return this.stateManager.getCount()
  }

  /**
   * Marks every `'loaded'` entry whose `(value, args)` satisfy `callback`
   * as `'obsolete'`. Entries in other states are skipped. The `args` passed
   * to `callback` are the ones recorded by the most recent `get` / `reload`
   * / `setExplicitValue` for that entry — see {@link CacheSettings.getKey}
   * for the no-mutate constraint.
   */
  public obsoleteRange(callback: (entity: TData, args: TArgs) => boolean) {
    this.stateManager.obsoleteRange(callback)
  }

  /** {@link Cache.obsoleteRange} for removal. Same iteration + args contract. */
  public removeRange(callback: (entity: TData, args: TArgs) => boolean) {
    this.stateManager.removeRange(callback)
  }

  public flushAll() {
    this.stateManager.flushAll()
  }
}
