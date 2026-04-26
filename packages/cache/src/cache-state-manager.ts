import { ObservableValue } from '@furystack/utils'
import type { CacheResult, FailedCacheResult, LoadedCacheResult, ObsoleteCacheResult } from './cache-result.js'
import { isLoadedCacheResult, isObsoleteCacheResult } from './cache-result.js'

interface CacheStateManagerOptions {
  capacity?: number
}

export class CannotObsoleteUnloadedError<T> extends Error {
  constructor(public readonly cacheResult: CacheResult<T>) {
    super('Cannot set obsolete state for a non-loaded value')
  }
}

interface CacheStoreEntry<T, TArgs extends any[]> {
  observable: ObservableValue<CacheResult<T>>
  args: TArgs
}

export class CacheStateManager<T, TArgs extends any[]> implements Disposable {
  private readonly store = new Map<string, CacheStoreEntry<T, TArgs>>()

  public [Symbol.dispose]() {
    ;[...this.store.values()].forEach((entry) => entry.observable[Symbol.dispose]())
    this.store.clear()
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
      this.store.set(key, { observable: new ObservableValue<CacheResult<T>>(initialState), args })
    }

    if (this.store.size > (this.options.capacity || Infinity)) {
      const [firstKey] = this.store.keys()
      this.store.get(firstKey)?.observable[Symbol.dispose]()
      this.store.delete(firstKey)
    }

    return (this.store.get(key) as CacheStoreEntry<T, TArgs>).observable
  }

  private peekValue(key: string): T | undefined {
    return this.store.get(key)?.observable.getValue().value
  }

  public setValue(key: string, args: TArgs, value: CacheResult<T>) {
    this.getObservable(key, args).setValue(value)
  }

  public setLoadingState(key: string, args: TArgs) {
    this.setValue(key, args, { status: 'loading', value: this.peekValue(key), updatedAt: new Date() })
  }

  public setLoadedState(key: string, args: TArgs, value: T) {
    const newValue: LoadedCacheResult<T> = { status: 'loaded', value, updatedAt: new Date() }
    this.setValue(key, args, newValue)
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
      return currentValue // Already obsolete
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
      existing.observable[Symbol.dispose]()
    }
    return this.store.delete(key)
  }

  public flushAll() {
    this.store.forEach((entry) => entry.observable[Symbol.dispose]())
    this.store.clear()
  }

  public obsoleteRange(predicate: (value: T, args: TArgs) => boolean) {
    ;[...this.store.entries()].forEach(([key, { observable, args }]) => {
      const currentState = observable.getValue()
      if (!isLoadedCacheResult(currentState)) {
        return
      }
      if (predicate(currentState.value, args)) {
        this.setObsoleteState(key, args)
      }
    })
  }

  public removeRange(predicate: (value: T, args: TArgs) => boolean) {
    ;[...this.store.entries()].forEach(([key, { observable, args }]) => {
      const currentState = observable.getValue()
      if (!isLoadedCacheResult(currentState)) {
        return
      }
      if (predicate(currentState.value, args)) {
        this.remove(key)
      }
    })
  }

  constructor(private readonly options: CacheStateManagerOptions) {}
}
