import type { Disposable, ObservableValue, ValueChangeCallback } from '@furystack/utils'
import type { ValueObserver } from '@furystack/utils'

/**
 * Class for managing observables and disposables for components, based on key-value maps
 */
export class ResourceManager {
  private readonly disposables = new Map<string, Disposable>()

  public useDisposable<T extends Disposable>(key: string, factory: () => T): T {
    if (!this.disposables.has(key)) {
      this.disposables.set(key, factory())
    }
    return this.disposables.get(key) as T
  }

  public readonly observers = new Map<string, ValueObserver<any>>()

  public useObservable = <T>(
    key: string,
    observable: ObservableValue<T>,
    callback: ValueChangeCallback<T>,
    getLast?: boolean,
  ): [value: T, setValue: (newValue: T) => void] => {
    const alreadyUsed = this.observers.get(key) as ValueObserver<T> | undefined
    if (alreadyUsed) {
      return [alreadyUsed.observable.getValue(), alreadyUsed.observable.setValue]
    }
    const observer = observable.subscribe(callback, getLast)
    this.observers.set(key, observer)
    return [observable.getValue(), observable.setValue.bind(observable)]
  }

  public dispose() {
    this.disposables.forEach((r) => r.dispose())
    this.disposables.clear()
    this.observers.forEach((r) => r.dispose())
    this.observers.clear()
  }
}
