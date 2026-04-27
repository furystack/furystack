import type { ValueObserverOptions } from './value-observer.js'
import { ValueObserver } from './value-observer.js'

/** Thrown by {@link ObservableValue.getValue} / {@link ObservableValue.setValue} / {@link ObservableValue.subscribe} after the value has been disposed. */
export class ObservableAlreadyDisposedError extends Error {
  constructor() {
    super('Observable already disposed')
  }
}

export type ValueChangeCallback<T> = (next: T) => void | PromiseLike<void>

export type ObservableValueOptions<T> = {
  /**
   * Returns `true` to treat `nextValue` as a change (and notify observers),
   * `false` to skip. Defaults to `!==` reference equality.
   */
  compare: (lastValue: T, nextValue: T) => boolean
  /**
   * Called when an observer callback or filter throws (sync) or rejects
   * (async). Remaining observers are still notified. Defaults to logging
   * via `console.error`.
   */
  onError: (options: { error: unknown; observer: ValueObserver<T> }) => void
}

const defaultComparer = <T>(a: T, b: T) => a !== b

/**
 * Disposable holder for a single value with subscription support.
 *
 * @example
 * ```ts
 * using(new ObservableValue<number>(0), (value) => {
 *   const observer = value.subscribe((next) => console.log('changed:', next))
 *   value.setValue(42)
 *   observer[Symbol.dispose]()
 * })
 * ```
 */
export class ObservableValue<T> implements Disposable {
  public get isDisposed(): boolean {
    return this._isDisposed
  }

  private _isDisposed = false

  public [Symbol.dispose]() {
    this.observers.clear()
    this._isDisposed = true
    // @ts-expect-error getting currentValue after disposing is not allowed
    this.currentValue = null
  }
  private observers: Set<ValueObserver<T>> = new Set()
  private currentValue: T

  /**
   * Subscribes `callback` to value changes. Dispose the returned
   * {@link ValueObserver} (or call {@link ObservableValue.unsubscribe}) to
   * stop receiving notifications. Throws {@link ObservableAlreadyDisposedError}
   * after disposal.
   */
  public subscribe(callback: ValueChangeCallback<T>, options?: ValueObserverOptions<T>) {
    if (this._isDisposed) {
      throw new ObservableAlreadyDisposedError()
    }
    const observer = new ValueObserver<T>(this, callback, options)
    this.observers.add(observer)
    return observer
  }

  public unsubscribe(observer: ValueObserver<T>) {
    return this.observers.delete(observer)
  }

  /** Throws {@link ObservableAlreadyDisposedError} after disposal. */
  public getValue(): T {
    if (this._isDisposed) {
      throw new ObservableAlreadyDisposedError()
    }
    return this.currentValue
  }

  /**
   * Sets the value. Observers are notified only when
   * {@link ObservableValueOptions.compare} reports a change. Throws
   * {@link ObservableAlreadyDisposedError} after disposal.
   */
  public setValue(newValue: T) {
    if (this._isDisposed) {
      throw new ObservableAlreadyDisposedError()
    }
    if (this.options.compare(this.currentValue, newValue)) {
      this.currentValue = newValue
      this.observers.forEach((observer) => {
        try {
          if (observer.options?.filter?.(this.currentValue, newValue) !== false) {
            const result = observer.callback(newValue)
            if (result && typeof result.then === 'function') {
              result.then(undefined, (error: unknown) => {
                this.options.onError({ error, observer })
              })
            }
          }
        } catch (error) {
          this.options.onError({ error, observer })
        }
      })
    }
  }

  public getObservers() {
    return [...this.observers] as ReadonlyArray<ValueObserver<T>>
  }

  private readonly options: ObservableValueOptions<T>

  constructor(initialValue: T, options?: Partial<ObservableValueOptions<T>>) {
    this.options = {
      compare: defaultComparer,
      onError: ({ error }) => console.error('Error in ObservableValue observer', error),
      ...options,
    }
    this.currentValue = initialValue
  }
}
