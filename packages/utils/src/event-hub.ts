import type { Disposable } from './disposable.js'

type ListenerFunction<T extends string, EventTypeMap extends { [K in T]: any }> = (arg: EventTypeMap[T]) => void

export class EventHub<T extends string, EventTypeMap extends { [K in T]: any }> implements Disposable {
  private listeners = new Map<T, Set<ListenerFunction<T, EventTypeMap>>>()

  public addListener<TEvent extends T>(event: TEvent, listener: ListenerFunction<TEvent, EventTypeMap>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener as ListenerFunction<T, EventTypeMap>)
  }

  public removeListener<TEvent extends T>(event: TEvent, listener: ListenerFunction<TEvent, EventTypeMap>) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener as ListenerFunction<T, EventTypeMap>)
    }
  }

  public emit<TEvent extends T>(event: TEvent, arg: EventTypeMap[TEvent]) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((listener) => listener(arg))
    }
  }

  public dispose() {
    this.listeners.clear()
  }
}
