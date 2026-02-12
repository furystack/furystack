import type { FilterType } from '@furystack/core'
import type { Constructable, Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import { Repository } from '@furystack/repository'
import type { SyncChangeEntry, ServerSyncMessage, SyncVersion } from '@furystack/entity-sync'
import type WebSocket from 'ws'

type EntitySubscription = {
  subscriptionId: string
  socket: WebSocket
  clientInjector: Injector
  modelName: string
  type: 'entity'
  key: unknown
  currentSeq: number
}

type CollectionSubscription = {
  subscriptionId: string
  socket: WebSocket
  clientInjector: Injector
  modelName: string
  type: 'collection'
  filter?: unknown
  top?: number
  skip?: number
  order?: Record<string, 'ASC' | 'DESC'>
  currentSeq: number
  /** Tracks which entities are currently in the collection for diffing */
  currentEntities: Map<unknown, unknown>
}

type Subscription = EntitySubscription | CollectionSubscription

type ModelRegistration = {
  model: Constructable<unknown>
  modelName: string
  primaryKey: string
  currentSeq: number
  changelog: SyncChangeEntry[]
  changelogRetentionMs: number
  debounceMs: number
  queryTtlMs: number
  eventSubscriptions: Disposable[]
  getEntity: (injector: Injector, key: unknown) => Promise<unknown>
  findEntities: (
    injector: Injector,
    options: {
      filter?: unknown
      top?: number
      skip?: number
      order?: Record<string, 'ASC' | 'DESC'>
    },
  ) => Promise<unknown[]>
}

type QueryCacheEntry = {
  result: unknown[]
  timestamp: number
}

/**
 * Options for model registration
 */
export type ModelSyncOptions = {
  /** How long to keep change entries for delta sync (default: 5 minutes) */
  changelogRetentionMs?: number
  /** Debounce window in ms for batching notifications (default: 0 = immediate) */
  debounceMs?: number
  /** TTL in ms for cached find() results on collection subscriptions (default: 0 = no cache) */
  queryTtlMs?: number
}

/**
 * Manages entity and collection subscriptions and dispatches changes to connected WebSocket clients.
 * Tracks a per-model changelog with sequence numbers for delta sync support.
 * Supports configurable debounce and query caching for collection subscriptions.
 */
@Injectable({ lifetime: 'singleton' })
export class SubscriptionManager implements Disposable {
  private readonly modelRegistrations = new Map<string, ModelRegistration>()
  private readonly subscriptions = new Map<string, Subscription>()
  private readonly socketSubscriptionIds = new Map<WebSocket, Set<string>>()
  private subscriptionCounter = 0

  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly pendingEntityMessages = new Map<string, ServerSyncMessage[]>()
  private readonly queryCache = new Map<string, QueryCacheEntry>()

  /**
   * Registers a model for entity sync.
   * Subscribes to the model's DataSet events to track changes and maintain a changelog.
   * @param model The model class (wire name derived from constructor.name)
   * @param primaryKey The primary key field of the model
   * @param options Optional configuration
   */
  public registerModel<T, TPrimaryKey extends keyof T>(
    model: Constructable<T>,
    primaryKey: TPrimaryKey,
    options?: ModelSyncOptions,
  ): void {
    const modelName = model.name

    if (this.modelRegistrations.has(modelName)) {
      const existing = this.modelRegistrations.get(modelName)!
      if (existing.model !== model) {
        throw new Error(`Model name conflict: '${modelName}' is already registered by a different class`)
      }
      return
    }

    const dataSet = this.repository.getDataSetFor(model, primaryKey)

    const registration: ModelRegistration = {
      model,
      modelName,
      primaryKey: primaryKey as string,
      currentSeq: 0,
      changelog: [],
      changelogRetentionMs: options?.changelogRetentionMs ?? 5 * 60 * 1000,
      debounceMs: options?.debounceMs ?? 0,
      queryTtlMs: options?.queryTtlMs ?? 0,
      eventSubscriptions: [],
      getEntity: (injector, key) => dataSet.get(injector, key as T[TPrimaryKey]),
      findEntities: async (injector, findOptions) => {
        const result = await dataSet.find(injector, {
          filter: findOptions.filter as FilterType<T> | undefined,
          top: findOptions.top,
          skip: findOptions.skip,
          order: findOptions.order as { [P in keyof T]?: 'ASC' | 'DESC' } | undefined,
        })
        return result as unknown[]
      },
    }

    registration.eventSubscriptions = [
      dataSet.subscribe('onEntityAdded', ({ entity }) => {
        this.handleEntityAdded(
          modelName,
          entity as unknown as Record<string, unknown>,
          (entity as unknown as Record<string, unknown>)[primaryKey as string],
        )
      }),
      dataSet.subscribe('onEntityUpdated', ({ id, change }) => {
        this.handleEntityUpdated(modelName, id, change as unknown as Record<string, unknown>)
      }),
      dataSet.subscribe('onEntityRemoved', ({ key }) => {
        this.handleEntityRemoved(modelName, key)
      }),
    ]

    this.modelRegistrations.set(modelName, registration)
  }

  private incrementVersion(registration: ModelRegistration): SyncVersion {
    registration.currentSeq++
    return {
      seq: registration.currentSeq,
      timestamp: new Date().toISOString(),
    }
  }

  private pruneChangelog(registration: ModelRegistration): void {
    const cutoff = Date.now() - registration.changelogRetentionMs
    registration.changelog = registration.changelog.filter(
      (entry) => new Date(entry.version.timestamp).getTime() > cutoff,
    )
  }

  private handleEntityAdded(modelName: string, entity: Record<string, unknown>, entityKey: unknown): void {
    const registration = this.modelRegistrations.get(modelName)
    if (!registration) return

    const version = this.incrementVersion(registration)
    registration.changelog.push({ type: 'added', entity, version })
    this.pruneChangelog(registration)

    for (const sub of this.subscriptions.values()) {
      if (sub.modelName !== modelName) continue

      if (sub.type === 'entity' && sub.key === entityKey) {
        const message: ServerSyncMessage = {
          type: 'entity-added',
          subscriptionId: sub.subscriptionId,
          entity,
          version,
        }
        this.dispatchEntityNotification(sub, message, registration)
      } else if (sub.type === 'collection') {
        this.scheduleCollectionEvaluation(sub, registration)
      }
    }
  }

  private handleEntityUpdated(modelName: string, id: unknown, change: Record<string, unknown>): void {
    const registration = this.modelRegistrations.get(modelName)
    if (!registration) return

    const version = this.incrementVersion(registration)
    registration.changelog.push({ type: 'updated', id, change, version })
    this.pruneChangelog(registration)

    for (const sub of this.subscriptions.values()) {
      if (sub.modelName !== modelName) continue

      if (sub.type === 'entity' && sub.key === id) {
        const message: ServerSyncMessage = {
          type: 'entity-updated',
          subscriptionId: sub.subscriptionId,
          id,
          change,
          version,
        }
        this.dispatchEntityNotification(sub, message, registration)
      } else if (sub.type === 'collection') {
        this.scheduleCollectionEvaluation(sub, registration)
      }
    }
  }

  private handleEntityRemoved(modelName: string, key: unknown): void {
    const registration = this.modelRegistrations.get(modelName)
    if (!registration) return

    const version = this.incrementVersion(registration)
    registration.changelog.push({ type: 'removed', id: key, version })
    this.pruneChangelog(registration)

    for (const sub of this.subscriptions.values()) {
      if (sub.modelName !== modelName) continue

      if (sub.type === 'entity' && sub.key === key) {
        const message: ServerSyncMessage = {
          type: 'entity-removed',
          subscriptionId: sub.subscriptionId,
          id: key,
          version,
        }
        this.dispatchEntityNotification(sub, message, registration)
      } else if (sub.type === 'collection') {
        this.scheduleCollectionEvaluation(sub, registration)
      }
    }
  }

  /**
   * Dispatches a notification to an entity subscription, respecting debounce settings.
   */
  private dispatchEntityNotification(
    sub: EntitySubscription,
    message: ServerSyncMessage,
    registration: ModelRegistration,
  ): void {
    if (registration.debounceMs === 0) {
      this.sendMessage(sub.socket, message)
      sub.currentSeq = registration.currentSeq
    } else {
      if (!this.pendingEntityMessages.has(sub.subscriptionId)) {
        this.pendingEntityMessages.set(sub.subscriptionId, [])
      }
      this.pendingEntityMessages.get(sub.subscriptionId)!.push(message)

      this.scheduleDebounce(sub.subscriptionId, registration.debounceMs, () => {
        this.flushEntityMessages(sub.subscriptionId)
      })
    }
  }

  /**
   * Schedules a collection subscription for re-evaluation, respecting debounce settings.
   */
  private scheduleCollectionEvaluation(sub: CollectionSubscription, registration: ModelRegistration): void {
    if (registration.debounceMs === 0) {
      void this.evaluateCollectionSubscription(sub)
    } else {
      this.scheduleDebounce(sub.subscriptionId, registration.debounceMs, () => {
        void this.evaluateCollectionSubscription(sub)
      })
    }
  }

  private scheduleDebounce(subscriptionId: string, debounceMs: number, callback: () => void): void {
    const existing = this.debounceTimers.get(subscriptionId)
    if (existing) {
      clearTimeout(existing)
    }
    this.debounceTimers.set(
      subscriptionId,
      setTimeout(() => {
        this.debounceTimers.delete(subscriptionId)
        callback()
      }, debounceMs),
    )
  }

  private flushEntityMessages(subscriptionId: string): void {
    const sub = this.subscriptions.get(subscriptionId)
    if (!sub || sub.type !== 'entity') return

    const pending = this.pendingEntityMessages.get(subscriptionId)
    if (pending && pending.length > 0) {
      for (const msg of pending) {
        this.sendMessage(sub.socket, msg)
        if ('version' in msg) {
          sub.currentSeq = msg.version.seq
        }
      }
      this.pendingEntityMessages.delete(subscriptionId)
    }
  }

  /**
   * Re-evaluates a collection subscription by re-querying the DataSet and diffing against stored state.
   * Sends entity-added, entity-updated, and entity-removed messages as needed.
   */
  private async evaluateCollectionSubscription(sub: CollectionSubscription): Promise<void> {
    const registration = this.modelRegistrations.get(sub.modelName)
    if (!registration) return

    if (!this.subscriptions.has(sub.subscriptionId)) return

    const results = await this.queryWithCache(sub, registration)

    const newEntities = new Map<unknown, unknown>()
    for (const entity of results) {
      const key = (entity as Record<string, unknown>)[registration.primaryKey]
      newEntities.set(key, entity)
    }

    const version: SyncVersion = { seq: registration.currentSeq, timestamp: new Date().toISOString() }

    // Detect removed entities (in old set but not in new set)
    for (const [key] of sub.currentEntities) {
      if (!newEntities.has(key)) {
        this.sendMessage(sub.socket, {
          type: 'entity-removed',
          subscriptionId: sub.subscriptionId,
          id: key,
          version,
        })
      }
    }

    // Detect added and updated entities
    for (const [key, entity] of newEntities) {
      const oldEntity = sub.currentEntities.get(key)
      if (!oldEntity) {
        this.sendMessage(sub.socket, {
          type: 'entity-added',
          subscriptionId: sub.subscriptionId,
          entity,
          version,
        })
      } else {
        const change = this.computeShallowDiff(oldEntity as Record<string, unknown>, entity as Record<string, unknown>)
        if (change) {
          this.sendMessage(sub.socket, {
            type: 'entity-updated',
            subscriptionId: sub.subscriptionId,
            id: key,
            change,
            version,
          })
        }
      }
    }

    sub.currentEntities = newEntities
    sub.currentSeq = registration.currentSeq
  }

  private computeShallowDiff(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
  ): Record<string, unknown> | null {
    const change: Record<string, unknown> = {}
    let hasChange = false
    for (const key of Object.keys(newObj)) {
      if (newObj[key] !== oldObj[key]) {
        change[key] = newObj[key]
        hasChange = true
      }
    }
    return hasChange ? change : null
  }

  private async queryWithCache(sub: CollectionSubscription, registration: ModelRegistration): Promise<unknown[]> {
    if (registration.queryTtlMs > 0) {
      const cached = this.queryCache.get(sub.subscriptionId)
      if (cached && Date.now() - cached.timestamp < registration.queryTtlMs) {
        return cached.result
      }
    }

    const result = await registration.findEntities(sub.clientInjector, {
      filter: sub.filter,
      top: sub.top,
      skip: sub.skip,
      order: sub.order,
    })

    if (registration.queryTtlMs > 0) {
      this.queryCache.set(sub.subscriptionId, { result, timestamp: Date.now() })
    }

    return result
  }

  private sendMessage(socket: WebSocket, message: ServerSyncMessage): void {
    // readyState 1 = OPEN
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(message))
    }
  }

  /**
   * Subscribes a client to entity changes.
   * Supports delta sync when the client provides a lastSeq and the changelog covers the gap.
   * @param socket The client's WebSocket connection
   * @param clientInjector The client's scoped injector for authorization
   * @param requestId The client's request ID for correlation
   * @param modelName The model wire name (derived from constructor.name)
   * @param key The entity's primary key value
   * @param lastSeq Optional: client's last known seq for delta sync
   */
  public async subscribeEntity(
    socket: WebSocket,
    clientInjector: Injector,
    requestId: string,
    modelName: string,
    key: unknown,
    lastSeq?: number,
  ): Promise<void> {
    const registration = this.modelRegistrations.get(modelName)
    if (!registration) {
      this.sendMessage(socket, {
        type: 'subscription-error',
        requestId,
        error: `Model '${modelName}' is not registered for sync`,
      })
      return
    }

    try {
      const subscriptionId = `sub-${++this.subscriptionCounter}`

      // Try delta sync if client provides lastSeq
      if (lastSeq !== undefined && registration.changelog.length > 0) {
        const oldestEntry = registration.changelog[0]
        if (oldestEntry.version.seq <= lastSeq + 1) {
          const relevantChanges = registration.changelog.filter((entry) => {
            if (entry.version.seq <= lastSeq) return false
            if (entry.type === 'added') {
              return (entry.entity as Record<string, unknown>)[registration.primaryKey] === key
            }
            return entry.id === key
          })

          this.storeEntitySubscription(subscriptionId, socket, clientInjector, modelName, key, registration.currentSeq)

          this.sendMessage(socket, {
            type: 'subscribed',
            requestId,
            subscriptionId,
            model: modelName,
            mode: 'delta',
            changes: relevantChanges,
            version: { seq: registration.currentSeq, timestamp: new Date().toISOString() },
          })
          return
        }
      }

      // Full snapshot - fetch entity with authorization
      const entity = await registration.getEntity(clientInjector, key)

      this.storeEntitySubscription(subscriptionId, socket, clientInjector, modelName, key, registration.currentSeq)

      this.sendMessage(socket, {
        type: 'subscribed',
        requestId,
        subscriptionId,
        model: modelName,
        mode: 'snapshot',
        data: entity,
        version: { seq: registration.currentSeq, timestamp: new Date().toISOString() },
      })
    } catch (error) {
      this.sendMessage(socket, {
        type: 'subscription-error',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Subscribes a client to a collection of entities matching the given filter.
   * Sends a full snapshot of matching entities on subscribe.
   * On subsequent changes, re-evaluates the collection and sends diffs.
   * @param socket The client's WebSocket connection
   * @param clientInjector The client's scoped injector for authorization
   * @param requestId The client's request ID for correlation
   * @param modelName The model wire name (derived from constructor.name)
   * @param filter Optional filter to match entities
   * @param top Optional limit on the number of results
   * @param skip Optional offset for pagination
   * @param order Optional sort order
   */
  public async subscribeCollection(
    socket: WebSocket,
    clientInjector: Injector,
    requestId: string,
    modelName: string,
    filter?: unknown,
    top?: number,
    skip?: number,
    order?: Record<string, 'ASC' | 'DESC'>,
  ): Promise<void> {
    const registration = this.modelRegistrations.get(modelName)
    if (!registration) {
      this.sendMessage(socket, {
        type: 'subscription-error',
        requestId,
        error: `Model '${modelName}' is not registered for sync`,
      })
      return
    }

    try {
      const subscriptionId = `sub-${++this.subscriptionCounter}`

      const results = await registration.findEntities(clientInjector, {
        filter,
        top,
        skip,
        order,
      })

      const currentEntities = new Map<unknown, unknown>()
      for (const entity of results) {
        const key = (entity as Record<string, unknown>)[registration.primaryKey]
        currentEntities.set(key, entity)
      }

      const subscription: CollectionSubscription = {
        subscriptionId,
        socket,
        clientInjector,
        modelName,
        type: 'collection',
        filter,
        top,
        skip,
        order,
        currentSeq: registration.currentSeq,
        currentEntities,
      }

      this.subscriptions.set(subscriptionId, subscription)
      this.trackSocket(socket, subscriptionId)

      this.sendMessage(socket, {
        type: 'subscribed',
        requestId,
        subscriptionId,
        model: modelName,
        primaryKey: registration.primaryKey,
        mode: 'snapshot',
        data: results,
        version: { seq: registration.currentSeq, timestamp: new Date().toISOString() },
      })
    } catch (error) {
      this.sendMessage(socket, {
        type: 'subscription-error',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  private storeEntitySubscription(
    subscriptionId: string,
    socket: WebSocket,
    clientInjector: Injector,
    modelName: string,
    key: unknown,
    currentSeq: number,
  ): void {
    const subscription: EntitySubscription = {
      subscriptionId,
      socket,
      clientInjector,
      modelName,
      type: 'entity',
      key,
      currentSeq,
    }
    this.subscriptions.set(subscriptionId, subscription)
    this.trackSocket(socket, subscriptionId)
  }

  /**
   * Removes a subscription
   * @param subscriptionId The subscription to remove
   */
  public unsubscribe(subscriptionId: string): void {
    const sub = this.subscriptions.get(subscriptionId)
    if (sub) {
      this.subscriptions.delete(subscriptionId)
      const socketSubs = this.socketSubscriptionIds.get(sub.socket)
      if (socketSubs) {
        socketSubs.delete(subscriptionId)
        if (socketSubs.size === 0) {
          this.socketSubscriptionIds.delete(sub.socket)
        }
      }

      this.cleanupSubscriptionState(subscriptionId)
    }
  }

  private cleanupSubscriptionState(subscriptionId: string): void {
    const timer = this.debounceTimers.get(subscriptionId)
    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(subscriptionId)
    }
    this.pendingEntityMessages.delete(subscriptionId)
    this.queryCache.delete(subscriptionId)
  }

  private trackSocket(socket: WebSocket, subscriptionId: string): void {
    if (!this.socketSubscriptionIds.has(socket)) {
      this.socketSubscriptionIds.set(socket, new Set())
      socket.on('close', () => {
        this.removeSubscriptionsForSocket(socket)
      })
    }
    this.socketSubscriptionIds.get(socket)!.add(subscriptionId)
  }

  private removeSubscriptionsForSocket(socket: WebSocket): void {
    const subs = this.socketSubscriptionIds.get(socket)
    if (subs) {
      for (const subId of subs) {
        this.subscriptions.delete(subId)
        this.cleanupSubscriptionState(subId)
      }
      this.socketSubscriptionIds.delete(socket)
    }
  }

  /**
   * Returns the model registration info for a model name
   * @param modelName The model wire name
   * @returns The registration info or undefined
   */
  public getModelRegistration(modelName: string) {
    const reg = this.modelRegistrations.get(modelName)
    if (!reg) return undefined
    return {
      modelName: reg.modelName,
      primaryKey: reg.primaryKey,
      currentSeq: reg.currentSeq,
      changelogLength: reg.changelog.length,
    }
  }

  /**
   * Returns the number of active subscriptions
   */
  public get activeSubscriptionCount(): number {
    return this.subscriptions.size
  }

  /**
   * Returns details of active subscriptions (for testing/debugging)
   */
  public getActiveSubscriptions(): Array<{
    subscriptionId: string
    modelName: string
    type: 'entity' | 'collection'
    key?: unknown
  }> {
    return [...this.subscriptions.values()].map((sub) => ({
      subscriptionId: sub.subscriptionId,
      modelName: sub.modelName,
      type: sub.type,
      ...(sub.type === 'entity' ? { key: sub.key } : {}),
    }))
  }

  public [Symbol.dispose](): void {
    for (const reg of this.modelRegistrations.values()) {
      for (const sub of reg.eventSubscriptions) {
        sub[Symbol.dispose]()
      }
    }

    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }

    this.modelRegistrations.clear()
    this.subscriptions.clear()
    this.socketSubscriptionIds.clear()
    this.debounceTimers.clear()
    this.pendingEntityMessages.clear()
    this.queryCache.clear()
  }

  @Injected(Repository)
  declare private readonly repository: Repository
}
