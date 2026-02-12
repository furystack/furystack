import type { ClientSyncMessage, FilterType, ServerSyncMessage, SyncState } from '@furystack/entity-sync'
import type { Constructable } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import { ObservableValue } from '@furystack/utils'
import type { LiveCollection } from './live-collection.js'
import type { LiveEntity } from './live-entity.js'
import type { SyncCacheEntry, SyncCacheStore } from './sync-cache-entry.js'

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
  /** Optional local cache store for stale-while-revalidate and delta sync on reconnect */
  localStore?: SyncCacheStore
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
  type: 'entity'
  state: ObservableValue<SyncState<unknown>>
  refCount: number
  subscriptionId?: string
  suspendTimer?: ReturnType<typeof setTimeout>
  modelName: string
  key: unknown
  requestId: string
  cacheKey: string
  lastSeq?: number
}

type LiveCollectionInternal = {
  type: 'collection'
  state: ObservableValue<SyncState<unknown[]>>
  refCount: number
  subscriptionId?: string
  suspendTimer?: ReturnType<typeof setTimeout>
  modelName: string
  filter?: unknown
  top?: number
  skip?: number
  order?: Record<string, 'ASC' | 'DESC'>
  requestId: string
  primaryKey?: string
  cacheKey: string
  lastSeq?: number
}

type LiveSubscriptionInternal = LiveEntityInternal | LiveCollectionInternal

/**
 * Client-side service for managing entity sync subscriptions over WebSocket.
 * Provides reference-counted LiveEntity and LiveCollection instances with auto-suspend.
 * Optionally supports local caching for stale-while-revalidate and delta sync on reconnect.
 */
@Injectable({ lifetime: 'explicit' })
export class EntitySyncService implements Disposable {
  private ws: WebSocket | null = null
  private readonly models = new Map<string, ModelEntry>()
  private readonly liveEntities = new Map<string, LiveEntityInternal>()
  private readonly liveCollections = new Map<string, LiveCollectionInternal>()
  private readonly pendingRequests = new Map<string, LiveSubscriptionInternal>()
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
      this.handleConnectionLoss()
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
   * When a local cache store is configured, cached data is shown immediately
   * while waiting for the server response (stale-while-revalidate).
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
        // Show stale data while waiting for server response
        internal.state.setValue({ status: 'cached', data: currentState.data })
        this.pendingRequests.set(internal.requestId, internal)
        this.send({
          type: 'subscribe-entity',
          requestId: internal.requestId,
          model: modelName,
          key,
          lastSeq: internal.lastSeq,
        })
      }

      return this.createLiveEntityHandle<T>(internal, entityKey)
    }

    // New subscription
    const requestId = `req-${++this.requestCounter}`
    internal = {
      type: 'entity',
      state: new ObservableValue<SyncState<unknown>>({ status: 'connecting' }),
      refCount: 1,
      modelName,
      key,
      requestId,
      cacheKey: entityKey,
    }

    this.liveEntities.set(entityKey, internal)
    this.pendingRequests.set(requestId, internal)

    this.initializeEntitySubscription(internal, modelName, key, requestId)

    return this.createLiveEntityHandle<T>(internal, entityKey)
  }

  /**
   * Subscribes to a collection of entities matching the given filter.
   * Returns a shared LiveCollection -- multiple callers with the same model+options
   * get the same instance (reference counted).
   * When a local cache store is configured, cached data is shown immediately
   * while waiting for the server response (stale-while-revalidate).
   * @param model The model class
   * @param options Optional filter, pagination, and ordering options
   * @returns A LiveCollection handle (dispose when done)
   */
  public subscribeCollection<T>(
    model: Constructable<T>,
    options?: {
      filter?: FilterType<T>
      top?: number
      skip?: number
      order?: { [P in keyof T]?: 'ASC' | 'DESC' }
    },
  ): LiveCollection<T> {
    const modelName = model.name
    const collectionKey = `${modelName}:collection:${JSON.stringify({
      filter: options?.filter,
      top: options?.top,
      skip: options?.skip,
      order: options?.order,
    })}`

    let internal = this.liveCollections.get(collectionKey)

    if (internal) {
      internal.refCount++

      if (internal.suspendTimer) {
        clearTimeout(internal.suspendTimer)
        internal.suspendTimer = undefined
      }

      const currentState = internal.state.getValue()
      if (currentState.status === 'suspended') {
        internal.requestId = `req-${++this.requestCounter}`
        // Show stale data while waiting for server response
        internal.state.setValue({ status: 'cached', data: currentState.data })
        this.pendingRequests.set(internal.requestId, internal)
        this.send({
          type: 'subscribe-collection',
          requestId: internal.requestId,
          model: modelName,
          filter: options?.filter as FilterType<unknown>,
          top: options?.top,
          skip: options?.skip,
          order: options?.order as Record<string, 'ASC' | 'DESC'>,
          lastSeq: internal.lastSeq,
        })
      }

      return this.createLiveCollectionHandle<T>(internal, collectionKey)
    }

    const requestId = `req-${++this.requestCounter}`
    internal = {
      type: 'collection',
      state: new ObservableValue<SyncState<unknown[]>>({ status: 'connecting' }),
      refCount: 1,
      modelName,
      filter: options?.filter,
      top: options?.top,
      skip: options?.skip,
      order: options?.order as Record<string, 'ASC' | 'DESC'>,
      requestId,
      cacheKey: collectionKey,
    }

    this.liveCollections.set(collectionKey, internal)
    this.pendingRequests.set(requestId, internal)

    this.initializeCollectionSubscription(
      internal,
      modelName,
      options as { filter?: FilterType<unknown>; top?: number; skip?: number; order?: Record<string, 'ASC' | 'DESC'> },
      requestId,
    )

    return this.createLiveCollectionHandle<T>(internal, collectionKey)
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

  private createLiveCollectionHandle<T>(internal: LiveCollectionInternal, collectionKey: string): LiveCollection<T> {
    let disposed = false
    return {
      state: internal.state as ObservableValue<SyncState<T[]>>,
      [Symbol.dispose]: () => {
        if (disposed) return
        disposed = true
        this.handleCollectionDispose(collectionKey)
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

  private handleCollectionDispose(collectionKey: string): void {
    const internal = this.liveCollections.get(collectionKey)
    if (!internal) return

    internal.refCount--

    if (internal.refCount <= 0) {
      const modelEntry = this.models.get(internal.modelName)
      const suspendDelayMs = modelEntry?.suspendDelayMs ?? this.options.suspendDelayMs ?? 1000

      if (suspendDelayMs === 0) {
        this.suspendCollection(collectionKey)
      } else if (suspendDelayMs === Infinity) {
        // Never suspend
      } else {
        internal.suspendTimer = setTimeout(() => {
          this.suspendCollection(collectionKey)
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
      this.persistToCache(internal.cacheKey, internal.modelName, currentState.data, internal.lastSeq)
    } else {
      // No data to retain, remove the entity
      this.liveEntities.delete(entityKey)
      if (!internal.state.isDisposed) {
        internal.state[Symbol.dispose]()
      }
    }
  }

  private suspendCollection(collectionKey: string): void {
    const internal = this.liveCollections.get(collectionKey)
    if (!internal) return

    if (internal.subscriptionId) {
      this.send({
        type: 'unsubscribe',
        subscriptionId: internal.subscriptionId,
      })
    }

    const currentState = internal.state.getValue()
    if (currentState.status === 'synced' && 'data' in currentState) {
      internal.state.setValue({ status: 'suspended', data: currentState.data })
      this.persistToCache(internal.cacheKey, internal.modelName, currentState.data, internal.lastSeq)
    } else {
      this.liveCollections.delete(collectionKey)
      if (!internal.state.isDisposed) {
        internal.state[Symbol.dispose]()
      }
    }
  }

  /**
   * Loads cached data from the local store (if configured) and sends the subscribe message.
   * If cached data is found, the state transitions to 'cached' before the server responds.
   */
  private initializeEntitySubscription(
    internal: LiveEntityInternal,
    modelName: string,
    key: unknown,
    requestId: string,
  ): void {
    if (this.options.localStore) {
      void this.options.localStore.get(internal.cacheKey).then(
        (cached) => {
          if (cached && internal.state.getValue().status === 'connecting') {
            internal.lastSeq = cached.lastSeq
            internal.state.setValue({ status: 'cached', data: cached.data })
          }
          this.send({
            type: 'subscribe-entity',
            requestId,
            model: modelName,
            key,
            lastSeq: internal.lastSeq,
          })
        },
        () => {
          // Cache load failed, proceed without cache
          this.send({ type: 'subscribe-entity', requestId, model: modelName, key })
        },
      )
    } else {
      this.send({
        type: 'subscribe-entity',
        requestId,
        model: modelName,
        key,
      })
    }
  }

  /**
   * Loads cached data from the local store (if configured) and sends the subscribe message.
   * If cached data is found, the state transitions to 'cached' before the server responds.
   */
  private initializeCollectionSubscription(
    internal: LiveCollectionInternal,
    modelName: string,
    options:
      | {
          filter?: FilterType<unknown>
          top?: number
          skip?: number
          order?: Record<string, 'ASC' | 'DESC'>
        }
      | undefined,
    requestId: string,
  ): void {
    if (this.options.localStore) {
      void this.options.localStore.get(internal.cacheKey).then(
        (cached) => {
          if (cached && internal.state.getValue().status === 'connecting') {
            internal.lastSeq = cached.lastSeq
            internal.state.setValue({ status: 'cached', data: cached.data as unknown[] })
          }
          this.send({
            type: 'subscribe-collection',
            requestId,
            model: modelName,
            filter: options?.filter as FilterType<unknown>,
            top: options?.top,
            skip: options?.skip,
            order: options?.order as Record<string, 'ASC' | 'DESC'>,
            lastSeq: internal.lastSeq,
          })
        },
        () => {
          // Cache load failed, proceed without cache
          this.send({
            type: 'subscribe-collection',
            requestId,
            model: modelName,
            filter: options?.filter as FilterType<unknown>,
            top: options?.top,
            skip: options?.skip,
            order: options?.order as Record<string, 'ASC' | 'DESC'>,
          })
        },
      )
    } else {
      this.send({
        type: 'subscribe-collection',
        requestId,
        model: modelName,
        filter: options?.filter as FilterType<unknown>,
        top: options?.top,
        skip: options?.skip,
        order: options?.order as Record<string, 'ASC' | 'DESC'>,
      })
    }
  }

  private handleMessage(message: ServerSyncMessage): void {
    switch (message.type) {
      case 'subscribed': {
        const internal = this.pendingRequests.get(message.requestId)
        if (!internal) return
        this.pendingRequests.delete(message.requestId)

        internal.subscriptionId = message.subscriptionId

        if (internal.type === 'entity') {
          if (message.mode === 'snapshot') {
            internal.lastSeq = message.version.seq
            internal.state.setValue({ status: 'synced', data: message.data })
            this.persistToCache(internal.cacheKey, internal.modelName, message.data, internal.lastSeq)
          } else if (message.mode === 'delta') {
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

            internal.lastSeq = message.version.seq
            internal.state.setValue({ status: 'synced', data })
            this.persistToCache(internal.cacheKey, internal.modelName, data, internal.lastSeq)
          }
        } else if (internal.type === 'collection') {
          internal.primaryKey = message.primaryKey
          if (message.mode === 'snapshot') {
            internal.lastSeq = message.version.seq
            internal.state.setValue({ status: 'synced', data: (message.data as unknown[]) ?? [] })
            this.persistToCache(
              internal.cacheKey,
              internal.modelName,
              (message.data as unknown[]) ?? [],
              internal.lastSeq,
            )
          } else if (message.mode === 'delta') {
            const currentState = internal.state.getValue()
            let data: unknown[] = 'data' in currentState ? currentState.data : []

            for (const change of message.changes) {
              if (change.type === 'added') {
                data = [...data, change.entity]
              } else if (change.type === 'updated' && internal.primaryKey) {
                data = data.map((item) => {
                  const pk = (item as Record<string, unknown>)[internal.primaryKey!]
                  if (pk === change.id) {
                    return { ...(item as Record<string, unknown>), ...change.change }
                  }
                  return item
                })
              } else if (change.type === 'removed' && internal.primaryKey) {
                data = data.filter((item) => {
                  const pk = (item as Record<string, unknown>)[internal.primaryKey!]
                  return pk !== change.id
                })
              }
            }

            internal.lastSeq = message.version.seq
            internal.state.setValue({ status: 'synced', data })
            this.persistToCache(internal.cacheKey, internal.modelName, data, internal.lastSeq)
          }
        }
        break
      }
      case 'entity-updated': {
        const sub = this.findBySubscriptionId(message.subscriptionId)
        if (!sub) return

        if (sub.type === 'entity') {
          const currentState = sub.state.getValue()
          if ('data' in currentState && currentState.data != null) {
            const updatedData = { ...(currentState.data as Record<string, unknown>), ...message.change }
            sub.lastSeq = message.version.seq
            sub.state.setValue({ status: 'synced', data: updatedData })
            this.persistToCache(sub.cacheKey, sub.modelName, updatedData, sub.lastSeq)
          }
        } else if (sub.type === 'collection') {
          const currentState = sub.state.getValue()
          if ('data' in currentState && Array.isArray(currentState.data) && sub.primaryKey) {
            const updatedData = currentState.data.map((item) => {
              const entityKey = (item as Record<string, unknown>)[sub.primaryKey!]
              if (entityKey === message.id) {
                return { ...(item as Record<string, unknown>), ...message.change }
              }
              return item
            })
            sub.lastSeq = message.version.seq
            sub.state.setValue({ status: 'synced', data: updatedData })
            this.persistToCache(sub.cacheKey, sub.modelName, updatedData, sub.lastSeq)
          }
        }
        break
      }
      case 'entity-added': {
        const sub = this.findBySubscriptionId(message.subscriptionId)
        if (!sub) return

        if (sub.type === 'entity') {
          sub.lastSeq = message.version.seq
          sub.state.setValue({ status: 'synced', data: message.entity })
          this.persistToCache(sub.cacheKey, sub.modelName, message.entity, sub.lastSeq)
        } else if (sub.type === 'collection') {
          const currentState = sub.state.getValue()
          if ('data' in currentState && Array.isArray(currentState.data)) {
            const updatedData = [...currentState.data, message.entity]
            sub.lastSeq = message.version.seq
            sub.state.setValue({ status: 'synced', data: updatedData })
            this.persistToCache(sub.cacheKey, sub.modelName, updatedData, sub.lastSeq)
          }
        }
        break
      }
      case 'entity-removed': {
        const sub = this.findBySubscriptionId(message.subscriptionId)
        if (!sub) return

        if (sub.type === 'entity') {
          sub.lastSeq = message.version.seq
          sub.state.setValue({ status: 'synced', data: undefined })
          this.persistToCache(sub.cacheKey, sub.modelName, undefined, sub.lastSeq)
        } else if (sub.type === 'collection') {
          const currentState = sub.state.getValue()
          if ('data' in currentState && Array.isArray(currentState.data) && sub.primaryKey) {
            const filteredData = currentState.data.filter((item) => {
              const entityKey = (item as Record<string, unknown>)[sub.primaryKey!]
              return entityKey !== message.id
            })
            sub.lastSeq = message.version.seq
            sub.state.setValue({ status: 'synced', data: filteredData })
            this.persistToCache(sub.cacheKey, sub.modelName, filteredData, sub.lastSeq)
          }
        }
        break
      }
      case 'subscription-error': {
        const internal = this.pendingRequests.get(message.requestId)
        if (!internal) return
        this.pendingRequests.delete(message.requestId)
        if (internal.type === 'entity') {
          internal.state.setValue({ status: 'error', error: message.error })
        } else if (internal.type === 'collection') {
          internal.state.setValue({ status: 'error', error: message.error })
        }
        break
      }
      default:
        break
    }
  }

  /**
   * Handles connection loss by transitioning synced subscriptions to cached state
   * (stale-while-revalidate) and others to error state.
   */
  private handleConnectionLoss(): void {
    for (const internal of this.liveEntities.values()) {
      if (internal.state.isDisposed) continue
      const currentState = internal.state.getValue()
      if (currentState.status === 'synced' && 'data' in currentState) {
        internal.state.setValue({ status: 'cached', data: currentState.data })
      } else if (currentState.status !== 'suspended' && currentState.status !== 'cached') {
        internal.state.setValue({ status: 'error', error: 'WebSocket error' })
      }
    }
    for (const internal of this.liveCollections.values()) {
      if (internal.state.isDisposed) continue
      const currentState = internal.state.getValue()
      if (currentState.status === 'synced' && 'data' in currentState) {
        internal.state.setValue({ status: 'cached', data: currentState.data })
      } else if (currentState.status !== 'suspended' && currentState.status !== 'cached') {
        internal.state.setValue({ status: 'error', error: 'WebSocket error' })
      }
    }
  }

  /**
   * Persists subscription data to the local cache store (fire-and-forget).
   * Errors are silently ignored to avoid disrupting the sync flow.
   */
  private persistToCache(cacheKey: string, modelName: string, data: unknown, lastSeq?: number): void {
    if (!this.options.localStore || lastSeq == null) return
    const entry: SyncCacheEntry = {
      subscriptionKey: cacheKey,
      model: modelName,
      lastSeq,
      data,
      timestamp: new Date().toISOString(),
    }
    void this.options.localStore.set(cacheKey, entry).catch(() => {
      /* ignore persistence errors */
    })
  }

  private findBySubscriptionId(subscriptionId: string): LiveSubscriptionInternal | undefined {
    for (const internal of this.liveEntities.values()) {
      if (internal.subscriptionId === subscriptionId) {
        return internal
      }
    }
    for (const internal of this.liveCollections.values()) {
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
    for (const internal of this.liveCollections.values()) {
      if (internal.suspendTimer) {
        clearTimeout(internal.suspendTimer)
      }
      if (!internal.state.isDisposed) {
        internal.state[Symbol.dispose]()
      }
    }
    this.liveEntities.clear()
    this.liveCollections.clear()
    this.pendingRequests.clear()
    this.pendingMessages.length = 0
    this.ws?.close()
  }
}
