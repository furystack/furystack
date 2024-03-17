import type { Disposable } from './disposable.js'
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
export type ValueChangeCallback<T> = (next: T) => void

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
 * observer.dispose();
 * // if you want to dispose the whole observableValue with all of its observers:
 * observableValue.dispose();
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
  public dispose() {
    this.observers.clear()
    this._isDisposed = true
  }
  private observers: Set<ValueObserver<T>> = new Set()
  private currentValue: T

  /**
   * Subscribes to a value changes
   * @param callback The callback method that will be called on each change
   * @param getLast Will call the callback with the last known value right after subscription
   * @returns The ValueObserver instance
   */
  public subscribe(callback: ValueChangeCallback<T>, getLast = false) {
    if (this._isDisposed) {
      throw new ObservableAlreadyDisposedError()
    }
    const observer = new ValueObserver<T>(this, callback)
    this.observers.add(observer)
    if (getLast) {
      callback(this.currentValue)
    }
    return observer
  }

  /**
   * The observer will unsubscribe from the Observable
   * @param observer The ValueObserver instance
   * @returns if unsubscribing was successfull
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
    if (this.currentValue !== newValue) {
      this.currentValue = newValue
      for (const subscription of this.observers) {
        subscription.callback(newValue)
      }
    }
  }

  /**
   * Gets the observers
   * @returns The subscribed observers
   */
  public getObservers() {
    return [...this.observers] as ReadonlyArray<ValueObserver<T>>
  }

  /**
   * @param initialValue Optional initial value
   */
  constructor(initialValue: T) {
    this.currentValue = initialValue
  }
}
