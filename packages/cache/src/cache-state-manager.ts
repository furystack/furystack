import type { Disposable } from '@furystack/utils'
import { ObservableValue } from '@furystack/utils'
import type { CacheResult } from './cache-result'
import { isLoadedCacheResult, isObsoleteCacheResult } from './cache-result'

export class CacheStateManager<T> implements Disposable {
  private readonly store = new Map<string, ObservableValue<CacheResult<T>>>()

  public dispose() {
    ;[...this.store.values()].forEach((value) => value.dispose())
    this.store.clear()
  }

  private getObservable(
    key: string,
    initialState: CacheResult<T> = { status: 'pending' },
  ): ObservableValue<CacheResult<T>> {
    if (!this.store.has(key)) {
      this.store.set(key, new ObservableValue<CacheResult<T>>(initialState))
    }
    return this.store.get(key) as ObservableValue<CacheResult<T>>
  }

  public subscribe(key: string, callback: (value: CacheResult<T>) => void) {
    return this.getObservable(key).subscribe(callback)
  }

  public setValue(key: string, value: CacheResult<T>) {
    this.getObservable(key).setValue(value)
  }

  public setPendingState(key: string) {
    this.setValue(key, { status: 'pending' })
  }

  public setLoadedState(key: string, value: T) {
    this.setValue(key, { status: 'loaded', value })
  }

  public setFailedState(key: string, error: unknown) {
    this.setValue(key, { status: 'failed', error })
  }

  public setObsoleteState(key: string) {
    const currentValue = this.getObservable(key).getValue()
    if (isLoadedCacheResult(currentValue)) {
      this.setValue(key, { ...currentValue, status: 'obsolete' })
    } else {
      throw new Error('Cannot set obsolete state for a non-loaded value')
    }
  }
}
