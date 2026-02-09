import { AggregatedError } from '@furystack/core'
import type { ValueChangeCallback, ValueObserver, ValueObserverOptions } from '@furystack/utils'
import { ObservableValue, isAsyncDisposable, isDisposable } from '@furystack/utils'

/**
 * Class for managing observables and disposables for components, based on key-value maps
 */
export class ResourceManager implements AsyncDisposable {
  private readonly disposables = new Map<string, Disposable | AsyncDisposable>()

  /**
   * Returns an existing disposable resource by key, or creates and caches a new one.
   * Resources are automatically disposed when the component is removed from the DOM.
   * @param key Unique key for caching this resource
   * @param factory Factory function called once to create the resource
   * @returns The cached or newly created resource
   */
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

  /**
   * Subscribes to an observable value by key. If the observable changes between renders,
   * the previous subscription is disposed and a new one is created.
   * @param key Unique key for caching this subscription
   * @param observable The observable to subscribe to
   * @param onChange Callback invoked when the value changes
   * @param options Additional observer options
   * @returns Tuple of [currentValue, setValue]
   */
  public useObservable = <T>(
    key: string,
    observable: ObservableValue<T>,
    onChange: ValueChangeCallback<T>,
    options?: ValueObserverOptions<T>,
  ): [value: T, setValue: (newValue: T) => void] => {
    const alreadyUsed = this.observers.get(key) as ValueObserver<T> | undefined
    if (alreadyUsed) {
      if (alreadyUsed.observable !== observable) {
        alreadyUsed[Symbol.dispose]()
        const observer = observable.subscribe(onChange, options)
        this.observers.set(key, observer)
        return [observable.getValue(), observable.setValue.bind(observable)]
      }
      return [alreadyUsed.observable.getValue(), alreadyUsed.observable.setValue.bind(alreadyUsed.observable)]
    }
    const observer = observable.subscribe(onChange, options)
    this.observers.set(key, observer)
    return [observable.getValue(), observable.setValue.bind(observable)]
  }

  public readonly stateObservers = new Map<string, ObservableValue<any>>()

  /**
   * Creates or retrieves a local state observable by key.
   * State is persisted across re-renders and disposed with the component.
   * @param key Unique key for caching this state
   * @param initialValue Initial value used on first call
   * @param callback Callback invoked when the state changes
   * @returns Tuple of [currentValue, setValue]
   */
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

  public async [Symbol.asyncDispose]() {
    const disposeResult = await Promise.allSettled(
      [...this.disposables].map(async ([_key, resource]) => {
        if (isDisposable(resource)) {
          resource[Symbol.dispose]()
        }
        if (isAsyncDisposable(resource)) {
          await resource[Symbol.asyncDispose]()
        }
      }),
    )

    const fails = disposeResult.filter((r) => r.status === 'rejected')
    if (fails && fails.length) {
      const error = new AggregatedError(
        `There was an error during disposing ${fails.length} stores: ${fails.map((f) => f.reason as string).join(', ')}`,
        fails,
      )
      throw error
    }

    this.disposables.clear()
    this.observers.forEach((r) => r[Symbol.dispose]())
    this.observers.clear()

    this.stateObservers.forEach((r) => r[Symbol.dispose]())
    this.stateObservers.clear()
  }
}
