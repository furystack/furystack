import type { ObservableValue, ValueChangeCallback } from './observable-value.js'

export type ValueObserverOptions<T> = {
  filter?: (nextValue: T, lastValue: T) => boolean
}

/**
 * Subscription handle returned by {@link ObservableValue.subscribe}. Disposing
 * the observer unsubscribes the callback from the observable; disposing the
 * underlying {@link ObservableValue} drops every observer and renders all
 * existing handles inert.
 */
export class ValueObserver<T> implements Disposable {
  public [Symbol.dispose]() {
    this.observable.unsubscribe(this)
  }

  constructor(
    public readonly observable: ObservableValue<T>,
    public callback: ValueChangeCallback<T>,
    public readonly options?: ValueObserverOptions<T>,
  ) {}
}
