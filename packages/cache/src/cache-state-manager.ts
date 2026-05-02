import { ObservableValue } from '@furystack/utils'
import type { Cache } from './cache.js'
import type { CacheResult, FailedCacheResult, LoadedCacheResult, ObsoleteCacheResult } from './cache-result.js'
import { isLoadedCacheResult, isObsoleteCacheResult } from './cache-result.js'

interface CacheStateManagerOptions {
  capacity?: number
}

/**
 * Thrown by {@link CacheStateManager.setObsoleteState} when invoked on an
 * entry that is not in the `loaded` state.
 *
 * @internal
 */
export class CannotObsoleteUnloadedError<T> extends Error {
  constructor(public readonly cacheResult: CacheResult<T>) {
    super('Cannot set obsolete state for a non-loaded value')
  }
}

interface CacheStoreEntry<T, TArgs extends any[]> {
  observable: ObservableValue<CacheResult<T>>
  args: TArgs
  tags: Set<string>
}

/**
 * Low-level storage primitive used by {@link Cache}. Tracks per-key
 * `ObservableValue<CacheResult<T>>` plus the most recent `args` that
 * produced it and an optional set of tags derived from the loaded
 * value (see {@link Cache.obsoleteByTag} / {@link Cache.removeByTag}).
 *
 * **Not part of the public API.** Method signatures may change without
 * a major version bump. Use {@link Cache} from `@furystack/cache`
 * instead — it owns the load/dedupe/timer lifecycle on top of this
 * primitive.
 *
 * @internal
 */
export class CacheStateManager<T, TArgs extends any[]> implements Disposable {
  private readonly store = new Map<string, CacheStoreEntry<T, TArgs>>()

  private readonly tagIndex = new Map<string, Set<string>>()

  public [Symbol.dispose]() {
    ;[...this.store.values()].forEach((entry) => entry.observable[Symbol.dispose]())
    this.store.clear()
    this.tagIndex.clear()
  }

  public has(index: string) {
    return this.store.has(index)
  }

  public getObservable(
    key: string,
    args: TArgs,
    initialState: CacheResult<T> = { status: 'loading', updatedAt: new Date() },
  ): ObservableValue<CacheResult<T>> {
    const existing = this.store.get(key)
    if (existing) {
      this.store.delete(key)
      existing.args = args
      this.store.set(key, existing)
    } else {
      this.store.set(key, {
        observable: new ObservableValue<CacheResult<T>>(initialState),
        args,
        tags: new Set<string>(),
      })
    }

    if (this.store.size > (this.options.capacity || Infinity)) {
      const [firstKey] = this.store.keys()
      this.dropTagsForKey(firstKey)
      this.store.get(firstKey)?.observable[Symbol.dispose]()
      this.store.delete(firstKey)
    }

    return (this.store.get(key) as CacheStoreEntry<T, TArgs>).observable
  }

  private peekValue(key: string): T | undefined {
    return this.store.get(key)?.observable.getValue().value
  }

  public setValue(key: string, args: TArgs, value: CacheResult<T>, tags?: readonly string[]) {
    this.getObservable(key, args).setValue(value)
    if (tags !== undefined) {
      this.updateTagsForKey(key, tags)
    }
  }

  public setLoadingState(key: string, args: TArgs) {
    this.setValue(key, args, { status: 'loading', value: this.peekValue(key), updatedAt: new Date() })
  }

  public setLoadedState(key: string, args: TArgs, value: T, tags?: readonly string[]) {
    const newValue: LoadedCacheResult<T> = { status: 'loaded', value, updatedAt: new Date() }
    this.setValue(key, args, newValue, tags)
    return newValue
  }

  public setFailedState(key: string, args: TArgs, error: unknown) {
    const newState: FailedCacheResult<T> = {
      status: 'failed',
      error,
      value: this.peekValue(key),
      updatedAt: new Date(),
    }
    this.setValue(key, args, newState)
    return newState
  }

  public setObsoleteState(key: string, args: TArgs): ObsoleteCacheResult<T> {
    const currentValue = this.getObservable(key, args).getValue()

    if (isObsoleteCacheResult(currentValue)) {
      return currentValue
    }

    if (isLoadedCacheResult(currentValue)) {
      const newValue: ObsoleteCacheResult<T> = { ...currentValue, status: 'obsolete' }
      this.setValue(key, args, newValue)
      return newValue
    } else {
      throw new CannotObsoleteUnloadedError(currentValue)
    }
  }

  public getCount() {
    return this.store.size
  }

  public remove(key: string) {
    const existing = this.store.get(key)
    if (existing) {
      this.dropTagsForKey(key)
      existing.observable[Symbol.dispose]()
    }
    return this.store.delete(key)
  }

  public flushAll() {
    this.store.forEach((entry) => entry.observable[Symbol.dispose]())
    this.store.clear()
    this.tagIndex.clear()
  }

  /**
   * Transitions every `loaded` entry tagged with `tag` to `obsolete`.
   * Entries in other states are skipped. Returns the count of entries
   * actually transitioned.
   */
  public obsoleteByTag(tag: string): number {
    const keys = this.tagIndex.get(tag)
    if (!keys || keys.size === 0) return 0
    let count = 0
    for (const key of [...keys]) {
      const entry = this.store.get(key)
      if (!entry) continue
      const current = entry.observable.getValue()
      if (isLoadedCacheResult(current)) {
        this.setObsoleteState(key, entry.args)
        count++
      }
    }
    return count
  }

  /**
   * Removes every entry tagged with `tag` regardless of state. Returns
   * the keys of removed entries so the {@link Cache} wrapper can clear
   * any per-key timers it owns.
   */
  public removeByTag(tag: string): string[] {
    const keys = this.tagIndex.get(tag)
    if (!keys || keys.size === 0) return []
    const removed: string[] = []
    for (const key of [...keys]) {
      if (this.remove(key)) {
        removed.push(key)
      }
    }
    return removed
  }

  private updateTagsForKey(key: string, nextTags: readonly string[]) {
    const entry = this.store.get(key)
    if (!entry) return
    const dedupedNext = new Set<string>(nextTags)

    for (const tag of entry.tags) {
      if (!dedupedNext.has(tag)) {
        const set = this.tagIndex.get(tag)
        if (set) {
          set.delete(key)
          if (set.size === 0) {
            this.tagIndex.delete(tag)
          }
        }
      }
    }

    for (const tag of dedupedNext) {
      if (!entry.tags.has(tag)) {
        let set = this.tagIndex.get(tag)
        if (!set) {
          set = new Set<string>()
          this.tagIndex.set(tag, set)
        }
        set.add(key)
      }
    }

    entry.tags = dedupedNext
  }

  private dropTagsForKey(key: string) {
    const entry = this.store.get(key)
    if (!entry) return
    for (const tag of entry.tags) {
      const set = this.tagIndex.get(tag)
      if (set) {
        set.delete(key)
        if (set.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    }
    entry.tags.clear()
  }

  constructor(private readonly options: CacheStateManagerOptions) {}
}
