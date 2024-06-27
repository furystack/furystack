import type { ValueChangeCallback, ValueObserver, ValueObserverOptions } from '@furystack/utils'
import { ObservableValue, isAsyncDisposable, isDisposable } from '@furystack/utils'

/**
 * Class for managing observables and disposables for components, based on key-value maps
 */
export class ResourceManager {
  private readonly disposables = new Map<string, Disposable | AsyncDisposable>()

  public useDisposable<T extends Disposable | AsyncDisposable>(key: string, factory: () => T): T {
    const existing = this.disposables.get(key)
    if (!existing) {
      const created = factory()
      this.disposables.set(key, created)
      return created
    }
    return existing as T
  }

  public readonly observers = new Map<string, ValueObserver<any>>()

  public useObservable = <T>(
    key: string,
    observable: ObservableValue<T>,
    onChange: ValueChangeCallback<T>,
    options?: ValueObserverOptions<T>,
  ): [value: T, setValue: (newValue: T) => void] => {
    const alreadyUsed = this.observers.get(key) as ValueObserver<T> | undefined
    if (alreadyUsed) {
      return [alreadyUsed.observable.getValue(), alreadyUsed.observable.setValue.bind(alreadyUsed.observable)]
    }
    const observer = observable.subscribe(onChange, options)
    this.observers.set(key, observer)
    return [observable.getValue(), observable.setValue.bind(observable)]
  }

  public readonly stateObservers = new Map<string, ObservableValue<any>>()

  public useState = <T>(
    key: string,
    initialValue: T,
    callback: ValueChangeCallback<T>,
  ): [value: T, setValue: (newValue: T) => void] => {
    if (!this.stateObservers.has(key)) {
      const newObservable = new ObservableValue<T>(initialValue)
      this.stateObservers.set(key, newObservable)
      newObservable.subscribe(callback)
    }
    const observable = this.stateObservers.get(key) as ObservableValue<T>
    return [observable.getValue(), observable.setValue.bind(observable)]
  }

  public [Symbol.dispose]() {
    this.disposables.forEach((r) => {
      if (isDisposable(r)) {
        r[Symbol.dispose]()
      }
      if (isAsyncDisposable(r)) {
        r[Symbol.asyncDispose]()
      }
    })
    this.disposables.clear()
    this.observers.forEach((r) => r[Symbol.dispose]())
    this.observers.clear()

    this.stateObservers.forEach((r) => r[Symbol.dispose]())
    this.stateObservers.clear()
  }
}
