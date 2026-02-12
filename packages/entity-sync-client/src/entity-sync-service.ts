import type { Constructable } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import type { ClientSyncMessage, ServerSyncMessage, SyncState } from '@furystack/entity-sync'
import type { LiveEntity } from './live-entity.js'

/**
 * Options for the EntitySyncService
 */
export type EntitySyncServiceOptions = {
  /** The WebSocket URL to connect to */
  wsUrl: string
  /** Global default delay before suspending a subscription with no observers (ms). Default: 1000 */
  suspendDelayMs?: number
  /** Optional factory for creating WebSocket instances (useful for testing) */
  createWebSocket?: (url: string) => WebSocket
}

/**
 * Options for per-model registration
 */
export type ModelRegistrationOptions = {
  /** Per-model override for suspend delay (overrides global default) */
  suspendDelayMs?: number
}

type ModelEntry = {
  model: Constructable<unknown>
  suspendDelayMs?: number
}

type LiveEntityInternal = {
  state: ObservableValue<SyncState<unknown>>
  refCount: number
  subscriptionId?: string
  suspendTimer?: ReturnType<typeof setTimeout>
  modelName: string
  key: unknown
  requestId: string
}

/**
 * Client-side service for managing entity sync subscriptions over WebSocket.
 * Provides reference-counted LiveEntity instances with auto-suspend.
 */
@Injectable({ lifetime: 'explicit' })
export class EntitySyncService implements Disposable {
  private ws: WebSocket | null = null
  private readonly models = new Map<string, ModelEntry>()
  private readonly liveEntities = new Map<string, LiveEntityInternal>()
  private readonly pendingRequests = new Map<string, LiveEntityInternal>()
  private readonly pendingMessages: string[] = []
  private requestCounter = 0

  constructor(private readonly options: EntitySyncServiceOptions) {
    this.connect()
  }

  private connect(): void {
    const createWs = this.options.createWebSocket ?? ((url: string) => new WebSocket(url))
    this.ws = createWs(this.options.wsUrl)

    this.ws.onopen = () => {
      this.flushPendingMessages()
    }

    this.ws.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(String(event.data)) as ServerSyncMessage
      this.handleMessage(message)
    }

    this.ws.onerror = () => {
      for (const internal of this.liveEntities.values()) {
        if (!internal.state.isDisposed) {
          internal.state.setValue({ status: 'error', error: 'WebSocket error' })
        }
      }
    }
  }

  private flushPendingMessages(): void {
    for (const msg of this.pendingMessages) {
      this.ws!.send(msg)
    }
    this.pendingMessages.length = 0
  }

  private send(message: ClientSyncMessage): void {
    const data = JSON.stringify(message)
    // readyState 1 = OPEN
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(data)
    } else {
      this.pendingMessages.push(data)
    }
  }

  /**
   * Registers a model class for sync (derives wire name from constructor.name).
   * Throws on name conflict with an already-registered model.
   * @param model The model class
   * @param options Optional per-model configuration
   */
  public registerModel<T>(model: Constructable<T>, options?: ModelRegistrationOptions): void {
    const modelName = model.name

    if (this.models.has(modelName)) {
      const existing = this.models.get(modelName)!
      if (existing.model !== model) {
        throw new Error(`Model name conflict: '${modelName}' is already registered by a different class`)
      }
      return
    }

    this.models.set(modelName, {
      model,
      suspendDelayMs: options?.suspendDelayMs,
    })
  }

  /**
   * Subscribes to a single entity by primary key.
   * Returns a shared LiveEntity -- multiple callers for the same model+key
   * get the same instance (reference counted).
   * @param model The model class
   * @param key The entity's primary key value
   * @returns A LiveEntity handle (dispose when done)
   */
  public subscribeEntity<T>(model: Constructable<T>, key: unknown): LiveEntity<T> {
    const modelName = model.name
    const entityKey = `${modelName}:${String(key)}`

    let internal = this.liveEntities.get(entityKey)

    if (internal) {
      internal.refCount++

      // Cancel suspend timer if running
      if (internal.suspendTimer) {
        clearTimeout(internal.suspendTimer)
        internal.suspendTimer = undefined
      }

      // Re-subscribe if suspended
      const currentState = internal.state.getValue()
      if (currentState.status === 'suspended') {
        internal.requestId = `req-${++this.requestCounter}`
        internal.state.setValue({ status: 'connecting' })
        this.pendingRequests.set(internal.requestId, internal)
        this.send({
          type: 'subscribe-entity',
          requestId: internal.requestId,
          model: modelName,
          key,
        })
      }

      return this.createLiveEntityHandle<T>(internal, entityKey)
    }

    // New subscription
    const requestId = `req-${++this.requestCounter}`
    internal = {
      state: new ObservableValue<SyncState<unknown>>({ status: 'connecting' }),
      refCount: 1,
      modelName,
      key,
      requestId,
    }

    this.liveEntities.set(entityKey, internal)
    this.pendingRequests.set(requestId, internal)

    this.send({
      type: 'subscribe-entity',
      requestId,
      model: modelName,
      key,
    })

    return this.createLiveEntityHandle<T>(internal, entityKey)
  }

  private createLiveEntityHandle<T>(internal: LiveEntityInternal, entityKey: string): LiveEntity<T> {
    let disposed = false
    return {
      state: internal.state as ObservableValue<SyncState<T | undefined>>,
      [Symbol.dispose]: () => {
        if (disposed) return
        disposed = true
        this.handleEntityDispose(entityKey)
      },
    }
  }

  private handleEntityDispose(entityKey: string): void {
    const internal = this.liveEntities.get(entityKey)
    if (!internal) return

    internal.refCount--

    if (internal.refCount <= 0) {
      const modelEntry = this.models.get(internal.modelName)
      const suspendDelayMs = modelEntry?.suspendDelayMs ?? this.options.suspendDelayMs ?? 1000

      if (suspendDelayMs === 0) {
        this.suspendEntity(entityKey)
      } else if (suspendDelayMs === Infinity) {
        // Never suspend
      } else {
        internal.suspendTimer = setTimeout(() => {
          this.suspendEntity(entityKey)
        }, suspendDelayMs)
      }
    }
  }

  private suspendEntity(entityKey: string): void {
    const internal = this.liveEntities.get(entityKey)
    if (!internal) return

    // Send unsubscribe if we have a subscriptionId
    if (internal.subscriptionId) {
      this.send({
        type: 'unsubscribe',
        subscriptionId: internal.subscriptionId,
      })
    }

    // Transition to suspended state if we have data
    const currentState = internal.state.getValue()
    if (currentState.status === 'synced' && 'data' in currentState) {
      internal.state.setValue({ status: 'suspended', data: currentState.data })
    } else {
      // No data to retain, remove the entity
      this.liveEntities.delete(entityKey)
      if (!internal.state.isDisposed) {
        internal.state[Symbol.dispose]()
      }
    }
  }

  private handleMessage(message: ServerSyncMessage): void {
    switch (message.type) {
      case 'subscribed': {
        const internal = this.pendingRequests.get(message.requestId)
        if (!internal) return
        this.pendingRequests.delete(message.requestId)

        internal.subscriptionId = message.subscriptionId

        if (message.mode === 'snapshot') {
          internal.state.setValue({ status: 'synced', data: message.data })
        } else if (message.mode === 'delta') {
          // Apply delta changes on top of existing data
          const currentState = internal.state.getValue()
          let data: unknown = 'data' in currentState ? currentState.data : undefined

          for (const change of message.changes) {
            if (change.type === 'updated') {
              data = { ...(data as Record<string, unknown>), ...change.change }
            } else if (change.type === 'removed') {
              data = undefined
            } else if (change.type === 'added') {
              data = change.entity
            }
          }

          internal.state.setValue({ status: 'synced', data })
        }
        break
      }
      case 'entity-updated': {
        const sub = this.findBySubscriptionId(message.subscriptionId)
        if (!sub) return
        const currentState = sub.state.getValue()
        if ('data' in currentState && currentState.data != null) {
          const updatedData = { ...(currentState.data as Record<string, unknown>), ...message.change }
          sub.state.setValue({ status: 'synced', data: updatedData })
        }
        break
      }
      case 'entity-added': {
        const sub = this.findBySubscriptionId(message.subscriptionId)
        if (!sub) return
        sub.state.setValue({ status: 'synced', data: message.entity })
        break
      }
      case 'entity-removed': {
        const sub = this.findBySubscriptionId(message.subscriptionId)
        if (!sub) return
        sub.state.setValue({ status: 'synced', data: undefined })
        break
      }
      case 'subscription-error': {
        const internal = this.pendingRequests.get(message.requestId)
        if (!internal) return
        this.pendingRequests.delete(message.requestId)
        internal.state.setValue({ status: 'error', error: message.error })
        break
      }
      default:
        break
    }
  }

  private findBySubscriptionId(subscriptionId: string): LiveEntityInternal | undefined {
    for (const internal of this.liveEntities.values()) {
      if (internal.subscriptionId === subscriptionId) {
        return internal
      }
    }
    return undefined
  }

  public [Symbol.dispose](): void {
    for (const internal of this.liveEntities.values()) {
      if (internal.suspendTimer) {
        clearTimeout(internal.suspendTimer)
      }
      if (!internal.state.isDisposed) {
        internal.state[Symbol.dispose]()
      }
    }
    this.liveEntities.clear()
    this.pendingRequests.clear()
    this.pendingMessages.length = 0
    this.ws?.close()
  }
}
