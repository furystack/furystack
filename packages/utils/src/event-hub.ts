type ListenerFunction<EventTypeMap extends object, T extends keyof EventTypeMap> = (arg: EventTypeMap[T]) => void

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
      this.listeners.get(event)!.forEach((listener) => listener(arg))
    }
  }

  public [Symbol.dispose]() {
    this.listeners.clear()
  }
}
