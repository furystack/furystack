type ListenerFunction<EventTypeMap extends object, T extends keyof EventTypeMap> = (
  arg: EventTypeMap[T],
) => void | PromiseLike<void>

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
 * A typed event emitter that provides type-safe event subscription and emission.
 * Use this to create strongly-typed pub/sub patterns in your application.
 *
 * Listener errors (sync throws and async rejections) are caught automatically.
 * If `onListenerError` listeners are registered, errors are routed there.
 * Otherwise, they are logged via `console.error`.
 *
 * @typeParam EventTypeMap - An object type where keys are event names and values are event payload types
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
  private listeners = new Map<keyof EventTypeMap, Set<ListenerFunction<EventTypeMap, keyof EventTypeMap>>>()

  public addListener<TEvent extends keyof EventTypeMap>(
    event: TEvent,
    listener: ListenerFunction<EventTypeMap, TEvent>,
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener as ListenerFunction<EventTypeMap, keyof EventTypeMap>)
  }

  public removeListener<TEvent extends keyof EventTypeMap>(
    event: TEvent,
    listener: ListenerFunction<EventTypeMap, TEvent>,
  ) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener as ListenerFunction<EventTypeMap, keyof EventTypeMap>)
    }
  }

  public subscribe<TEvent extends keyof EventTypeMap>(
    event: TEvent,
    listener: ListenerFunction<EventTypeMap, TEvent>,
  ): Disposable {
    this.addListener(event, listener)
    return { [Symbol.dispose]: () => this.removeListener(event, listener) }
  }

  private handleListenerError(event: keyof EventTypeMap, error: unknown) {
    if (event === 'onListenerError') {
      console.error('Error in onListenerError handler', error)
      return
    }
    const errorListeners = this.listeners.get('onListenerError' as keyof EventTypeMap)
    if (errorListeners?.size) {
      for (const errorListener of errorListeners) {
        try {
          const result = errorListener({ event, error } as EventTypeMap[keyof EventTypeMap])
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
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((listener) => {
        try {
          const result = listener(arg)
          if (result && typeof result.then === 'function') {
            result.then(undefined, (error: unknown) => {
              this.handleListenerError(event, error)
            })
          }
        } catch (error) {
          this.handleListenerError(event, error)
        }
      })
    }
  }

  public [Symbol.dispose]() {
    this.listeners.clear()
  }
}
