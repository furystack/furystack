type ListenerFunction<EventTypeMap extends object, T extends keyof EventTypeMap> = (
  arg: EventTypeMap[T],
) => void | PromiseLike<void>

/**
 * A typed event emitter that provides type-safe event subscription and emission.
 * Use this to create strongly-typed pub/sub patterns in your application.
 *
 * @typeParam EventTypeMap - An object type where keys are event names and values are event payload types
 * @example
 * ```ts
 * type MyEvents = {
 *   userLoggedIn: { userId: string }
 *   userLoggedOut: { userId: string }
 *   dataUpdated: { items: string[] }
 * }
 *
 * const hub = new EventHub<MyEvents>()
 *
 * // Subscribe to events
 * hub.subscribe('userLoggedIn', (event) => {
 *   console.log('User logged in:', event.userId)
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

  public emit<TEvent extends keyof EventTypeMap>(event: TEvent, arg: EventTypeMap[TEvent]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((listener) => void listener(arg))
    }
  }

  public [Symbol.dispose]() {
    this.listeners.clear()
  }
}
