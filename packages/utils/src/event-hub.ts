type ListenerFunction<EventTypeMap extends object, T extends keyof EventTypeMap> = (
  arg: EventTypeMap[T],
) => void | PromiseLike<void>

type AnyListener = (arg: unknown) => void | PromiseLike<void>

/**
 * Payload emitted when a listener throws or rejects during {@link EventHub.emit}.
 * Subscribe to the `onListenerError` event to receive these.
 */
export type ListenerErrorPayload = {
  /** The event name that was being emitted when the error occurred */
  event: string | number | symbol
  /** The error thrown or rejected by the listener */
  error: unknown
}

/**
 * Typed pub/sub. Listener errors (sync throws and async rejections) are
 * caught automatically: if `onListenerError` listeners are registered they
 * receive the error, otherwise it is logged via `console.error`. One
 * listener throwing does not prevent the remaining listeners from running.
 *
 * @typeParam EventTypeMap - object whose keys are event names and values are
 *   the payload types
 * @example
 * ```ts
 * type MyEvents = {
 *   userLoggedIn: { userId: string }
 *   userLoggedOut: { userId: string }
 *   dataUpdated: { items: string[] }
 *   onListenerError: ListenerErrorPayload
 * }
 *
 * const hub = new EventHub<MyEvents>()
 *
 * // Subscribe to events
 * hub.subscribe('userLoggedIn', (event) => {
 *   console.log('User logged in:', event.userId)
 * })
 *
 * // Handle listener errors
 * hub.subscribe('onListenerError', ({ event, error }) => {
 *   console.error(`Listener for "${String(event)}" failed:`, error)
 * })
 *
 * // Emit events
 * hub.emit('userLoggedIn', { userId: '123' })
 *
 * // Clean up when done
 * hub[Symbol.dispose]()
 * ```
 */
export class EventHub<EventTypeMap extends object> implements Disposable {
  #listeners: Map<PropertyKey, Set<AnyListener>> = new Map()

  public addListener<TEvent extends keyof EventTypeMap>(
    event: TEvent,
    listener: ListenerFunction<EventTypeMap, TEvent>,
  ) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set())
    }
    this.#listeners.get(event)!.add(listener as AnyListener)
  }

  public removeListener<TEvent extends keyof EventTypeMap>(
    event: TEvent,
    listener: ListenerFunction<EventTypeMap, TEvent>,
  ) {
    if (this.#listeners.has(event)) {
      this.#listeners.get(event)!.delete(listener as AnyListener)
    }
  }

  /**
   * Subscribes `listener` to `event` and returns a `Disposable` that removes
   * the listener when disposed — preferred over the `addListener` /
   * `removeListener` pair for `using` / `useDisposable` integration.
   */
  public subscribe<TEvent extends keyof EventTypeMap>(
    event: TEvent,
    listener: ListenerFunction<EventTypeMap, TEvent>,
  ): Disposable {
    this.addListener(event, listener)
    return { [Symbol.dispose]: () => this.removeListener(event, listener) }
  }

  #handleListenerError(event: PropertyKey, error: unknown) {
    if (event === 'onListenerError') {
      console.error('Error in onListenerError handler', error)
      return
    }
    const errorListeners = this.#listeners.get('onListenerError')
    if (errorListeners?.size) {
      for (const errorListener of errorListeners) {
        try {
          const result = errorListener({ event, error })
          if (result && typeof result.then === 'function') {
            result.then(undefined, (err: unknown) => {
              console.error('Error in onListenerError handler', err)
            })
          }
        } catch (err) {
          console.error('Error in onListenerError handler', err)
        }
      }
    } else {
      console.error('Unhandled EventHub listener error', { event, error })
    }
  }

  public emit<TEvent extends keyof EventTypeMap>(event: TEvent, arg: EventTypeMap[TEvent]) {
    if (this.#listeners.has(event)) {
      this.#listeners.get(event)!.forEach((listener) => {
        try {
          const result = listener(arg)
          if (result && typeof result.then === 'function') {
            result.then(undefined, (error: unknown) => {
              this.#handleListenerError(event, error)
            })
          }
        } catch (error) {
          this.#handleListenerError(event, error)
        }
      })
    }
  }

  public [Symbol.dispose]() {
    this.#listeners.clear()
  }
}
