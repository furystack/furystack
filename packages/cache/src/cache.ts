import { EventHub, type ListenerErrorPayload, type ObservableValue } from '@furystack/utils'
import type { CacheResult } from './cache-result.js'
import { isLoadedCacheResult } from './cache-result.js'
import { CacheStateManager, CannotObsoleteUnloadedError } from './cache-state-manager.js'

export interface CacheSettings<TData, TArgs extends any[], TTag extends string = string> {
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
   */
  getKey?: (...args: TArgs) => string

  /**
   * Resolver for the set of tags attached to an entry whenever it
   * transitions to a `'loaded'` state (via successful `load` / `reload`
   * or {@link Cache.setExplicitValue} with a loaded value). Tags drive
   * {@link Cache.obsoleteByTag} and {@link Cache.removeByTag}, designed
   * to be serializable so a remote node on a cross-process bus can
   * reproduce the same invalidation by emitting the tag string.
   *
   * Receives both the loaded `value` and the originating `args`, so
   * tags can incorporate state that lives only on the value side
   * (e.g. the `username` extracted from a session-keyed identity).
   *
   * Tags are recomputed on every successful load and do not change
   * while an entry is in `loading` / `failed` / `obsolete` — the last
   * loaded value's tags persist, so `removeByTag` still matches an
   * entry that has since been marked obsolete.
   */
  getTags?: (value: TData, ...args: TArgs) => readonly TTag[]
}

/**
 * Async loader cache with state-machine semantics ({@link CacheResult}),
 * concurrent-load deduplication, optional LRU capacity, stale + cache
 * TTL timers, and serializable tag-based invalidation. Extends
 * {@link EventHub} with `onLoadError` and emits the inherited
 * `onListenerError`.
 *
 * @example
 * ```ts
 * type SessionCacheTag = `user:${string}`
 *
 * using(
 *   new Cache<User, [string], SessionCacheTag>({
 *     load: (sessionId: string) => resolveSession(sessionId),
 *     getKey: (sessionId) => `cookie:${sessionId}`,
 *     getTags: (user) => [`user:${user.username}`],
 *     staleTimeMs: 30_000,
 *   }),
 *   (cache) => {
 *     const obs = cache.getObservable('abc')
 *     obs.subscribe((state) => render(state))
 *     // Later, e.g. on password change:
 *     cache.removeByTag('user:alice')
 *   },
 * )
 * ```
 */
export class Cache<TData, TArgs extends any[], TTag extends string = string>
  extends EventHub<{
    onLoadError: { args: TArgs; error: unknown }
    onListenerError: ListenerErrorPayload
  }>
  implements Disposable
{
  constructor(private readonly options: CacheSettings<TData, TArgs, TTag>) {
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

  private resolveTags(value: TData, args: TArgs): readonly string[] | undefined {
    if (!this.options.getTags) return undefined
    return this.options.getTags(value, ...args)
  }

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
      this.stateManager.setLoadedState(index, args, loaded, this.resolveTags(loaded, args))
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
   * and cache TTL timers are (re-)armed and tags are recomputed via
   * {@link CacheSettings.getTags}. Other statuses leave timers and tags
   * untouched.
   */
  public setExplicitValue({ loadArgs, value }: { loadArgs: TArgs; value: CacheResult<TData> }) {
    const index = this.getIndex(...loadArgs)
    const isLoaded = isLoadedCacheResult(value)
    const tags = isLoaded ? this.resolveTags(value.value, loadArgs) : undefined
    this.stateManager.setValue(index, loadArgs, value, tags)
    if (isLoaded) {
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
   * Transitions every `'loaded'` entry currently tagged with `tag` to
   * `'obsolete'`. Entries in other states are skipped. Returns the
   * number of entries actually transitioned. The `tag` is a plain
   * string — designed for replication over a serializable bus.
   */
  public obsoleteByTag(tag: TTag): number {
    return this.stateManager.obsoleteByTag(tag)
  }

  /**
   * Removes every entry currently tagged with `tag` regardless of
   * state and clears any pending stale / cache TTL timers for those
   * entries. Returns the number of entries removed.
   */
  public removeByTag(tag: TTag): number {
    const removedKeys = this.stateManager.removeByTag(tag)
    for (const key of removedKeys) {
      this.clearTimers(key)
    }
    return removedKeys.length
  }

  public flushAll() {
    this.stateManager.flushAll()
  }
}
