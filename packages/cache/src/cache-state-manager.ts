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

export class CacheStateManager<T, TArgs extends any[]> implements Disposable {
  private readonly store = new Map<string, ObservableValue<CacheResult<T>>>()

  public [Symbol.dispose]() {
    ;[...this.store.values()].forEach((value) => value[Symbol.dispose]())
    this.store.clear()
  }

  public has(index: string) {
    return this.store.has(index)
  }

  public getObservable(
    key: string,
    initialState: CacheResult<T> = { status: 'uninitialized', updatedAt: new Date() },
  ): ObservableValue<CacheResult<T>> {
    const oldValue = this.store.get(key)
    if (oldValue) {
      this.store.delete(key)
      this.store.set(key, oldValue)
    } else {
      this.store.set(key, new ObservableValue<CacheResult<T>>(initialState))
    }

    if (this.store.size > (this.options.capacity || Infinity)) {
      const [firstKey] = this.store.keys()
      this.store.get(firstKey)?.[Symbol.dispose]()
      this.store.delete(firstKey)
    }

    return this.store.get(key) as ObservableValue<CacheResult<T>>
  }

  private getLastValue(key: string): T | undefined {
    return this.getObservable(key).getValue().value
  }

  public setValue(key: string, value: CacheResult<T>) {
    this.getObservable(key).setValue(value)
  }

  public setLoadingState(key: string) {
    this.setValue(key, { status: 'loading', value: this.getLastValue(key), updatedAt: new Date() })
  }

  public setLoadedState(key: string, value: T) {
    const newValue: LoadedCacheResult<T> = { status: 'loaded', value, updatedAt: new Date() }
    this.setValue(key, newValue)
    return newValue
  }

  public setFailedState(key: string, error: unknown) {
    const newState: FailedCacheResult<T> = {
      status: 'failed',
      error,
      value: this.getLastValue(key),
      updatedAt: new Date(),
    }
    this.setValue(key, newState)
    return newState
  }

  public setObsoleteState(key: string): ObsoleteCacheResult<T> {
    const currentValue = this.getObservable(key).getValue()

    if (isObsoleteCacheResult(currentValue)) {
      return currentValue // Already obsolete
    }

    if (isLoadedCacheResult(currentValue)) {
      const newValue: ObsoleteCacheResult<T> = { ...currentValue, status: 'obsolete' }
      this.setValue(key, newValue)
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
      existing[Symbol.dispose]()
    }
    return this.store.delete(key)
  }

  public flushAll() {
    this.store.forEach((value) => value[Symbol.dispose]())
    this.store.clear()
  }

  public obsoleteRange(predicate: (value: T, args: TArgs) => boolean) {
    ;[...this.store.entries()].forEach(([key, value]) => {
      const currentState = value.getValue()
      if (!isLoadedCacheResult(currentState)) {
        return
      }
      const args = JSON.parse(key) as TArgs
      if (predicate(currentState.value, args)) {
        this.setObsoleteState(key)
      }
    })
  }

  public removeRange(predicate: (value: T, args: TArgs) => boolean) {
    ;[...this.store.entries()].forEach(([key, value]) => {
      const currentValue = value.getValue().value
      const args = JSON.parse(key) as TArgs
      if (currentValue && predicate(currentValue, args)) {
        this.remove(key)
      }
    })
  }

  constructor(private readonly options: CacheStateManagerOptions) {}
}
