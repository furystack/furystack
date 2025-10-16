import type { ValueObserverOptions } from './value-observer.js'
import { ValueObserver } from './value-observer.js'

/**
 * Error thrown when you try to retrieve or set an observable value that is already disposed.
 */
export class ObservableAlreadyDisposedError extends Error {
  constructor() {
    super('Observable already disposed')
  }
}

/**
 * Callback type for observable value changes
 */
export type ValueChangeCallback<T> = (next: T) => void | PromiseLike<void>

export type ObservableValueOptions<T> = {
  /**
   * Defines a custom compare function to determine if the value should be updated and the observers should be notified
   * @param lastValue the last value
   * @param nextValue the next value
   * @returns whether the value should be updated and the observers should be notified
   */
  compare: (lastValue: T, nextValue: T) => boolean
}

const defaultComparer = <T>(a: T, b: T) => a !== b

/**
 * Defines an ObservableValue value object.
 *
 * You can set and get its value with it's *setValue()* and *getValue()* methods and you can subscribe to value changes with *subscribe()*
 *
 * Usage example:
 * ```ts
 * const observableValue = new ObservableValue<number>(0);
 * const observer = observableValue.subscribe((newValue) => {
 * console.log("Value changed:", newValue);
 * });
 * // To update the value
 * observableValue.setValue(Math.random());
 * // if you want to dispose a single observer
 * observer[Symbol.dispose]();
 * // if you want to dispose the whole observableValue with all of its observers:
 * observableValue[Symbol.dispose]();
 * ```
 * @param T Generic argument to indicate the value type
 */
export class ObservableValue<T> implements Disposable {
  public get isDisposed(): boolean {
    return this._isDisposed
  }

  private _isDisposed = false

  /**
   * Disposes the ObservableValue object, removes all observers
   */
  public [Symbol.dispose]() {
    this.observers.clear()
    this._isDisposed = true
    // @ts-expect-error getting currentValue after disposing is not allowed
    this.currentValue = null
  }
  private observers: Set<ValueObserver<T>> = new Set()
  private currentValue: T

  /**
   * Subscribes to a value changes
   * @param callback The callback method that will be called on each change
   * @param options Additional ObservableValue options
   * @returns The ValueObserver instance
   */
  public subscribe(callback: ValueChangeCallback<T>, options?: ValueObserverOptions<T>) {
    if (this._isDisposed) {
      throw new ObservableAlreadyDisposedError()
    }
    const observer = new ValueObserver<T>(this, callback, options)
    this.observers.add(observer)
    return observer
  }

  /**
   * The observer will unsubscribe from the Observable
   * @param observer The ValueObserver instance
   * @returns whether unsubscribing was successful
   */
  public unsubscribe(observer: ValueObserver<T>) {
    return this.observers.delete(observer)
  }

  /**
   * Gets the current Value
   * @returns The current value
   */
  public getValue(): T {
    if (this._isDisposed) {
      throw new ObservableAlreadyDisposedError()
    }
    return this.currentValue
  }

  /**
   * Sets a new value and notifies the observers.
   * @param newValue The new value to be set
   */
  public setValue(newValue: T) {
    if (this._isDisposed) {
      throw new ObservableAlreadyDisposedError()
    }
    if (this.options.compare(this.currentValue, newValue)) {
      this.currentValue = newValue
      this.observers.forEach((observer) => {
        if (observer.options?.filter?.(this.currentValue, newValue) !== false) {
          observer.callback(newValue)
        }
      })
    }
  }

  /**
   * Gets the observers
   * @returns The subscribed observers
   */
  public getObservers() {
    return [...this.observers] as ReadonlyArray<ValueObserver<T>>
  }

  private readonly options: ObservableValueOptions<T>

  /**
   * @param initialValue Optional initial value
   * @param options Additional options
   */
  constructor(initialValue: T, options?: Partial<ObservableValueOptions<T>>) {
    this.options = {
      compare: defaultComparer,
      ...options,
    }
    this.currentValue = initialValue
  }
}
