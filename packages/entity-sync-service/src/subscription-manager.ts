import { useSystemIdentityContext, type FilterType } from '@furystack/core'
import { defineService, type Injector, type Token } from '@furystack/inject'
import { type DataSetToken } from '@furystack/repository'
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
  /** Last sent total count, used to avoid redundant snapshot messages */
  lastTotalCount?: number
}

type Subscription = EntitySubscription | CollectionSubscription

type ModelRegistration = {
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
  countEntities: (injector: Injector, filter?: unknown) => Promise<number>
}

type QueryCacheEntry = {
  result: unknown[]
  count: number
  timestamp: number
}

/**
 * Options for model registration.
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
 * Subscription registry for entity sync. Tracks per-model changelogs, fans
 * out change events from the registered {@link DataSetToken}s to matching
 * WebSocket subscribers and supports debounced/cached collection queries.
 *
 * Configure via {@link useEntitySync} during application setup; the
 * registry itself is exposed via the {@link SubscriptionManager} token so
 * integration tests and websocket actions can resolve it directly.
 */
export interface SubscriptionManager extends Disposable {
  /**
   * Registers a data set for entity sync.
   * Subscribes to the underlying DataSet's events to track changes and
   * maintain a per-model changelog.
   *
   * **Important:** Only writes that go through the DataSet (via
   * `dataSet.add()`, `dataSet.update()`, `dataSet.remove()`) will trigger
   * sync notifications. Writes made directly to the underlying physical
   * store will **not** be detected.
   *
   * @param dataSetToken The DataSet token. `modelName` is derived from its
   *   `model.name` and used as the wire-format identifier.
   * @param options Optional sync configuration.
   */
  registerModel<T, TPrimaryKey extends keyof T>(
    dataSetToken: DataSetToken<T, TPrimaryKey>,
    options?: ModelSyncOptions,
  ): void
  /** Current active (entity + collection) subscription count. */
  readonly activeSubscriptionCount: number
  /** Returns summary info for a registered model, or `undefined`. */
  getModelRegistration(modelName: string):
    | {
        modelName: string
        primaryKey: string
        currentSeq: number
        changelogLength: number
      }
    | undefined
  /** Debug helper — returns every active subscription in wire-friendly form. */
  getActiveSubscriptions(): Array<{
    subscriptionId: string
    modelName: string
    type: 'entity' | 'collection'
    key?: unknown
  }>
  /**
   * Subscribes a client to entity changes.
   * Supports delta sync when the client provides a `lastSeq` and the
   * changelog covers the gap; otherwise returns a full snapshot.
   */
  subscribeEntity(
    socket: WebSocket,
    clientInjector: Injector,
    requestId: string,
    modelName: string,
    key: unknown,
    lastSeq?: number,
  ): Promise<void>
  /** Subscribes a client to a filtered collection. Sends a full snapshot on subscribe. */
  subscribeCollection(
    socket: WebSocket,
    clientInjector: Injector,
    requestId: string,
    modelName: string,
    filter?: unknown,
    top?: number,
    skip?: number,
    order?: Record<string, 'ASC' | 'DESC'>,
  ): Promise<void>
  /** Removes a subscription by id. No-op when the id is unknown. */
  unsubscribe(subscriptionId: string): void
}

class SubscriptionManagerImpl implements SubscriptionManager {
  private readonly modelRegistrations = new Map<string, ModelRegistration>()
  private readonly subscriptions = new Map<string, Subscription>()
  private readonly socketSubscriptionIds = new Map<WebSocket, Set<string>>()
  private subscriptionCounter = 0

  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()
  private readonly pendingEntityMessages = new Map<string, ServerSyncMessage[]>()
  private readonly queryCache = new Map<string, QueryCacheEntry>()

  constructor(private readonly systemInjector: Injector) {}

  public registerModel<T, TPrimaryKey extends keyof T>(
    dataSetToken: DataSetToken<T, TPrimaryKey>,
    options?: ModelSyncOptions,
  ): void {
    const modelName = dataSetToken.model.name
    const primaryKey = dataSetToken.primaryKey as string

    if (this.modelRegistrations.has(modelName)) {
      const existing = this.modelRegistrations.get(modelName)!
      if (existing.primaryKey !== primaryKey) {
        throw new Error(`Model name conflict: '${modelName}' is already registered with a different primary key`)
      }
      return
    }

    type AnyEntity = Record<string, unknown>
    const dataSet = this.systemInjector.get(dataSetToken)

    const registration: ModelRegistration = {
      modelName,
      primaryKey,
      currentSeq: 0,
      changelog: [],
      changelogRetentionMs: options?.changelogRetentionMs ?? 5 * 60 * 1000,
      debounceMs: options?.debounceMs ?? 0,
      queryTtlMs: options?.queryTtlMs ?? 0,
      eventSubscriptions: [],
      getEntity: (injector, key) => dataSet.get(injector, key as T[TPrimaryKey]) as Promise<unknown>,
      findEntities: async (injector, findOptions) => {
        const result = await dataSet.find(injector, {
          filter: findOptions.filter as FilterType<T> | undefined,
          top: findOptions.top,
          skip: findOptions.skip,
          order: findOptions.order as { [P in keyof T]?: 'ASC' | 'DESC' } | undefined,
        })
        return result as unknown[]
      },
      countEntities: (injector, filter) => dataSet.count(injector, filter as FilterType<T> | undefined),
    }

    registration.eventSubscriptions = [
      dataSet.subscribe('onEntityAdded', ({ entity }) => {
        this.handleEntityAdded(modelName, entity as unknown as AnyEntity, (entity as unknown as AnyEntity)[primaryKey])
      }),
      dataSet.subscribe('onEntityUpdated', ({ id, change }) => {
        this.handleEntityUpdated(modelName, id, change as unknown as AnyEntity)
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

  private scheduleCollectionEvaluation(sub: CollectionSubscription, registration: ModelRegistration): void {
    if (registration.debounceMs === 0) {
      void this.evaluateCollectionSubscription(sub).catch((error) => {
        this.sendMessage(sub.socket, {
          type: 'subscription-error',
          requestId: sub.subscriptionId,
          error: error instanceof Error ? error.message : 'Collection evaluation failed',
        })
      })
    } else {
      this.scheduleDebounce(sub.subscriptionId, registration.debounceMs, () => {
        void this.evaluateCollectionSubscription(sub).catch((error) => {
          this.sendMessage(sub.socket, {
            type: 'subscription-error',
            requestId: sub.subscriptionId,
            error: error instanceof Error ? error.message : 'Collection evaluation failed',
          })
        })
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

  private async evaluateCollectionSubscription(sub: CollectionSubscription): Promise<void> {
    const registration = this.modelRegistrations.get(sub.modelName)
    if (!registration) return

    if (!this.subscriptions.has(sub.subscriptionId)) return

    const { result: results, count: totalCount } = await this.queryWithCache(sub, registration)

    const newEntities = new Map<unknown, unknown>()
    for (const entity of results) {
      const key = (entity as Record<string, unknown>)[registration.primaryKey]
      newEntities.set(key, entity)
    }

    const hasChanges = this.hasCollectionChanged(sub.currentEntities, newEntities) || totalCount !== sub.lastTotalCount

    if (hasChanges) {
      const version: SyncVersion = { seq: registration.currentSeq, timestamp: new Date().toISOString() }
      this.sendMessage(sub.socket, {
        type: 'collection-snapshot',
        subscriptionId: sub.subscriptionId,
        data: results,
        totalCount,
        version,
      })
    }

    sub.currentEntities = newEntities
    sub.lastTotalCount = totalCount
    sub.currentSeq = registration.currentSeq
  }

  private hasCollectionChanged(oldEntities: Map<unknown, unknown>, newEntities: Map<unknown, unknown>): boolean {
    if (oldEntities.size !== newEntities.size) return true
    for (const [key] of oldEntities) {
      if (!newEntities.has(key)) return true
    }
    for (const [key, newEntity] of newEntities) {
      const oldEntity = oldEntities.get(key)
      if (!oldEntity) return true
      if (this.computeShallowDiff(oldEntity as Record<string, unknown>, newEntity as Record<string, unknown>))
        return true
    }
    return false
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

    for (const key of Object.keys(oldObj)) {
      if (!(key in newObj)) {
        change[key] = undefined
        hasChange = true
      }
    }

    return hasChange ? change : null
  }

  private async queryWithCache(
    sub: CollectionSubscription,
    registration: ModelRegistration,
  ): Promise<{ result: unknown[]; count: number }> {
    if (registration.queryTtlMs > 0) {
      const cached = this.queryCache.get(sub.subscriptionId)
      if (cached && Date.now() - cached.timestamp < registration.queryTtlMs) {
        return { result: cached.result, count: cached.count }
      }
    }

    const [result, count] = await Promise.all([
      registration.findEntities(sub.clientInjector, {
        filter: sub.filter,
        top: sub.top,
        skip: sub.skip,
        order: sub.order,
      }),
      registration.countEntities(sub.clientInjector, sub.filter),
    ])

    if (registration.queryTtlMs > 0) {
      this.queryCache.set(sub.subscriptionId, { result, count, timestamp: Date.now() })
    }

    return { result, count }
  }

  private sendMessage(socket: WebSocket, message: ServerSyncMessage): void {
    if (socket.readyState === 1) {
      socket.send(JSON.stringify(message))
    }
  }

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

      const [results, totalCount] = await Promise.all([
        registration.findEntities(clientInjector, {
          filter,
          top,
          skip,
          order,
        }),
        registration.countEntities(clientInjector, filter),
      ])

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
        lastTotalCount: totalCount,
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
        totalCount,
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

  public get activeSubscriptionCount(): number {
    return this.subscriptions.size
  }

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
}

/**
 * DI token for the singleton {@link SubscriptionManager}.
 *
 * The factory creates a dedicated system-identity child scope that the
 * manager uses to resolve DataSets and subscribe to change events. That
 * scope, and the manager's internal state, are torn down when the owning
 * injector is disposed.
 */
export const SubscriptionManager: Token<SubscriptionManager, 'singleton'> = defineService({
  name: 'furystack/entity-sync-service/SubscriptionManager',
  lifetime: 'singleton',
  factory: ({ injector, onDispose }): SubscriptionManager => {
    const systemInjector = useSystemIdentityContext({ injector, username: 'SubscriptionManager' })
    const manager = new SubscriptionManagerImpl(systemInjector)
    onDispose(async () => {
      // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
      manager[Symbol.dispose]()
      await systemInjector[Symbol.asyncDispose]()
    })
    return manager
  },
})
