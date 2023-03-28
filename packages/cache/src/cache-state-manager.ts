import type { Disposable } from '@furystack/utils'
import { ObservableValue } from '@furystack/utils'
import type { CacheResult, FailedCacheResult, LoadedCacheResult, ObsoleteCacheResult } from './cache-result'
import { isLoadedCacheResult, isObsoleteCacheResult } from './cache-result'

export class CacheStateManager<T> implements Disposable {
  private readonly store = new Map<string, ObservableValue<CacheResult<T>>>()

  public dispose() {
    ;[...this.store.values()].forEach((value) => value.dispose())
    this.store.clear()
  }

  public getObservable(
    key: string,
    initialState: CacheResult<T> = { status: 'pending', updatedAt: new Date() },
  ): ObservableValue<CacheResult<T>> {
    if (!this.store.has(key)) {
      this.store.set(key, new ObservableValue<CacheResult<T>>(initialState))
    }
    return this.store.get(key) as ObservableValue<CacheResult<T>>
  }

  private getLastValue(key: string): T | undefined {
    return this.getObservable(key).getValue().value
  }

  public setValue(key: string, value: CacheResult<T>) {
    this.getObservable(key).setValue(value)
  }

  public setPendingState(key: string) {
    this.setValue(key, { status: 'pending', value: this.getLastValue(key), updatedAt: new Date() })
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
      throw new Error('Cannot set obsolete state for a non-loaded value')
    }
  }

  public getCount() {
    return this.store.size
  }

  public remove(key: string) {
    this.store.delete(key)
  }
}
