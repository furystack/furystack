import type { ObservableValue, ValueChangeCallback } from './observable-value.js'

export type ValueObserverOptions<T> = {
  filter?: (nextValue: T, lastValue: T) => boolean
}

/**
 * Defines a generic ValueObserver instance
 *
 * A ValueObserver is created whenever you subscribe for an *ObservableValue* changes.
 *
 * Usage example:
 * ```ts
 *
 * const observableValue = new ObservableValue<number>(0);
 * const observer = observableValue.subscribe((newValue) => {
 * console.log("Value changed:", newValue);
 * });
 *
 * // To update the value
 * observableValue.setValue(Math.random());
 * // if you want to dispose a single observer
 * observer[Symbol.dispose]();
 * // if you want to dispose the whole observableValue with all of its observers:
 * observableValue[Symbol.dispose]();
 * ```
 * @param T This type parameter is the value type to observe
 */
export class ValueObserver<T> implements Disposable {
  /**
   * Disposes the ValueObserver instance. Unsubscribes from the observable
   */
  public [Symbol.dispose]() {
    this.observable.unsubscribe(this)
  }

  /**
   * @constructs ValueObserver<T> the ValueObserver instance
   * @param observable The related Observable object
   * @param callback The callback that will be fired on change
   * @param options Additional options
   */
  constructor(
    public readonly observable: ObservableValue<T>,
    public callback: ValueChangeCallback<T>,
    public readonly options?: ValueObserverOptions<T>,
  ) {}
}
