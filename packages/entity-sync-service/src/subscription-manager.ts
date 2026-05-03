import { IdentityContext, useSystemIdentityContext, type FilterType, type User } from '@furystack/core'
import { ReplayWindowExceededError } from '@furystack/cross-node-bus'
import type { ServerSyncMessage, SyncChangeEntry, SyncVersion } from '@furystack/entity-sync'
import { defineService, type Injector, type Token } from '@furystack/inject'
import { type DataSetToken } from '@furystack/repository'
import type WebSocket from 'ws'
import { createBusBackedChangeLog, type ChangeLog } from './change-log.js'
import { EntityChangeBus, type EntityChange, type EntityChangeEnvelope } from './entity-change-bus.js'
import type { useEntitySync } from './use-entity-sync.js'

type EntitySubscription = {
  subscriptionId: string
  socket: WebSocket
  clientInjector: Injector
  modelName: string
  type: 'entity'
  key: unknown
  currentSeq: string
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
  currentSeq: string
  /** Tracks which entities are currently in the collection for diffing */
  currentEntities: Map<unknown, unknown>
  /** Last sent total count, used to avoid redundant snapshot messages */
  lastTotalCount?: number
}

type Subscription = EntitySubscription | CollectionSubscription

type ModelRegistration = {
  modelName: string
  primaryKey: string
  debounceMs: number
  queryTtlMs: number
  /** `dataSet.subscribe(...)` handles for the publish side. */
  dataSetSubscriptions: Disposable[]
  /** `entityChangeBus.subscribe(...)` handle for the consume side. */
  busSubscription: Disposable
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

const INITIAL_SEQ = '0'

/** Sweep interval for the per-(topic, originId) dedup map. */
const DEDUP_SWEEP_MS = 5 * 60 * 1000
/** Idle threshold after which a `(topic, originId)` dedup entry is evicted. */
const DEDUP_IDLE_MS = 60 * 60 * 1000

const dedupKey = (modelName: string, originId: string): string => `${modelName}\u0000${originId}`

/**
 * Options for model registration.
 */
export type ModelSyncOptions = {
  /**
   * @deprecated The bus owns retention now — adapters define the window
   * (in-process: 1 000 messages per topic; Redis Streams: `MAXLEN`).
   * Configure on the adapter, not per-model. The field is accepted for
   * backwards compatibility and silently ignored.
   */
  changelogRetentionMs?: number
  /** Debounce window in ms for batching notifications (default: 0 = immediate) */
  debounceMs?: number
  /** TTL in ms for cached find() results on collection subscriptions (default: 0 = no cache) */
  queryTtlMs?: number
}

/**
 * Subscription registry for entity sync. Tracks per-model bus subscriptions,
 * fans changes published on the {@link EntityChangeBus} out to matching
 * WebSocket subscribers and supports debounced/cached collection queries.
 *
 * Configure via {@link useEntitySync} during application setup; the
 * registry itself is exposed via the {@link SubscriptionManager} token so
 * integration tests and websocket actions can resolve it directly.
 */
export interface SubscriptionManager extends Disposable {
  /**
   * Registers a data set for entity sync.
   * Subscribes to the underlying DataSet's events to publish changes onto
   * the {@link EntityChangeBus}, and subscribes back to the bus to fan
   * matching changes out to WebSocket subscribers.
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
        currentSeq: string
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
   * Supports delta sync when the client provides a `lastSeq` and the bus
   * retains the gap; otherwise returns a full snapshot.
   */
  subscribeEntity(
    socket: WebSocket,
    clientInjector: Injector,
    requestId: string,
    modelName: string,
    key: unknown,
    lastSeq?: string,
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

  /** Latest seq stamped by the bus per model — seeded on every receive. */
  private readonly lastSeqByModel = new Map<string, string>()
  /** Per-(modelName, originId) dedup state for at-least-once delivery. */
  private readonly dedup = new Map<string, { seq: string; ts: number }>()
  private readonly dedupTimer: ReturnType<typeof setInterval>

  private readonly changeLog: ChangeLog

  constructor(
    private readonly systemInjector: Injector,
    private readonly subscriptionScopeParent: Injector,
    private readonly entityChangeBus: EntityChangeBus,
  ) {
    this.changeLog = createBusBackedChangeLog(entityChangeBus.bus)
    // Bound timer drives idle eviction without touching the receive hot path.
    // Refed by Node by default; `unref` so the timer never blocks process exit
    // in test runners or short-lived scripts.
    this.dedupTimer = setInterval(() => this.sweepDedup(), DEDUP_SWEEP_MS)
    this.dedupTimer.unref?.()
  }

  /**
   * Captures the current identity from `clientInjector` (the per-message
   * scope provided by the websocket action) and returns a long-lived child
   * scope of the root injector with that identity bound on a fresh
   * {@link IdentityContext}.
   *
   * The per-message `clientInjector` is disposed by `useWebSocketApi` as
   * soon as the action returns, so retaining it for the lifetime of a
   * subscription would break re-evaluation queries that hit `authorizeGet`
   * (and any other code that resolves `IdentityContext`). Snapshotting the
   * user once at subscribe time keeps authorization consistent for the
   * lifetime of the subscription.
   */
  private async captureSubscriptionScope(clientInjector: Injector): Promise<Injector> {
    let capturedUser: User | undefined
    try {
      capturedUser = await clientInjector.get(IdentityContext).getCurrentUser<User>()
    } catch {
      capturedUser = undefined
    }

    const scope = this.subscriptionScopeParent.createScope({ owner: 'EntitySyncSubscription' })

    if (capturedUser) {
      const user = capturedUser
      const roles = Array.isArray(user.roles) ? [...user.roles] : []
      scope.bind(IdentityContext, () => ({
        isAuthenticated: () => Promise.resolve(true),
        isAuthorized: (...required: string[]) =>
          Promise.resolve(required.every((role) => roles.some((r) => r === role))),
        getCurrentUser: <TUser extends User>() => Promise.resolve(user as unknown as TUser),
      }))
    }

    return scope
  }

  private disposeSubscriptionScope(scope: Injector): void {
    void scope[Symbol.asyncDispose]().catch(() => {
      /* swallow: scope disposal failures should not break unsubscribe */
    })
  }

  public registerModel<T, TPrimaryKey extends keyof T>(
    dataSetToken: DataSetToken<T, TPrimaryKey>,
    _options?: ModelSyncOptions,
  ): void {
    const modelName = dataSetToken.model.name
    const primaryKey = dataSetToken.primaryKey as string
    const options = _options ?? {}

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
      debounceMs: options.debounceMs ?? 0,
      queryTtlMs: options.queryTtlMs ?? 0,
      dataSetSubscriptions: [],
      // Replaced below — declared up-front so the type stays narrow.
      busSubscription: { [Symbol.dispose]: () => undefined },
      getEntity: (injector, key) => dataSet.get(injector, key as T[TPrimaryKey]),
      findEntities: async (injector, findOptions) => {
        const result = await dataSet.find(injector, {
          filter: findOptions.filter as FilterType<T> | undefined,
          top: findOptions.top,
          skip: findOptions.skip,
          order: findOptions.order,
        })
        return result
      },
      countEntities: (injector, filter) => dataSet.count(injector, filter as FilterType<T> | undefined),
    }

    // Publish: every dataset event becomes a `bus.publish`. We void the
    // promise — bus errors are surfaced via `onCrossNodeError` telemetry, not
    // by failing the (synchronous) dataset event handler.
    registration.dataSetSubscriptions = [
      dataSet.subscribe('onEntityAdded', ({ entity }) => {
        const e = entity as unknown as AnyEntity
        void this.entityChangeBus.publish(modelName, {
          type: 'added',
          entity: e,
          primaryKey: e[primaryKey],
        })
      }),
      dataSet.subscribe('onEntityUpdated', ({ id, change }) => {
        void this.entityChangeBus.publish(modelName, { type: 'updated', id, change })
      }),
      dataSet.subscribe('onEntityRemoved', ({ key }) => {
        void this.entityChangeBus.publish(modelName, { type: 'removed', id: key })
      }),
    ]

    // Consume: a single bus subscription per model fans every change — local
    // and remote — through `handleBroadcastChange`.
    registration.busSubscription = this.entityChangeBus.subscribe(modelName, (envelope) =>
      this.handleBroadcastChange(envelope),
    )

    this.modelRegistrations.set(modelName, registration)
  }

  private handleBroadcastChange(envelope: EntityChangeEnvelope): void {
    const { modelName, change, version, originId } = envelope
    const { bus } = this.entityChangeBus
    const key = dedupKey(modelName, originId)
    const seen = this.dedup.get(key)
    const now = Date.now()
    if (seen && bus.compareSeq(version.seq, seen.seq) <= 0) {
      // Refresh ts — entry is still hot — but drop the duplicate delivery.
      seen.ts = now
      return
    }
    this.dedup.set(key, { seq: version.seq, ts: now })

    const lastSeen = this.lastSeqByModel.get(modelName)
    if (!lastSeen || bus.compareSeq(version.seq, lastSeen) > 0) {
      this.lastSeqByModel.set(modelName, version.seq)
    }

    const registration = this.modelRegistrations.get(modelName)
    if (!registration) return

    switch (change.type) {
      case 'added':
        this.dispatchAdded(registration, change, version)
        break
      case 'updated':
        this.dispatchUpdated(registration, change, version)
        break
      case 'removed':
        this.dispatchRemoved(registration, change, version)
        break
      default: {
        // Exhaustiveness — every {@link EntityChange} variant must be
        // dispatched explicitly. Adding a new variant without updating this
        // switch will fail to compile.
        const _exhaustive: never = change
        void _exhaustive
      }
    }
  }

  private sweepDedup(): void {
    const cutoff = Date.now() - DEDUP_IDLE_MS
    for (const [key, value] of this.dedup) {
      if (value.ts < cutoff) this.dedup.delete(key)
    }
  }

  private dispatchAdded(
    registration: ModelRegistration,
    change: Extract<EntityChange, { type: 'added' }>,
    version: SyncVersion,
  ): void {
    for (const sub of this.subscriptions.values()) {
      if (sub.modelName !== registration.modelName) continue

      if (sub.type === 'entity' && sub.key === change.primaryKey) {
        const message: ServerSyncMessage = {
          type: 'entity-added',
          subscriptionId: sub.subscriptionId,
          entity: change.entity,
          version,
        }
        this.dispatchEntityNotification(sub, message, registration)
      } else if (sub.type === 'collection') {
        this.scheduleCollectionEvaluation(sub, registration)
      }
    }
  }

  private dispatchUpdated(
    registration: ModelRegistration,
    change: Extract<EntityChange, { type: 'updated' }>,
    version: SyncVersion,
  ): void {
    for (const sub of this.subscriptions.values()) {
      if (sub.modelName !== registration.modelName) continue

      if (sub.type === 'entity' && sub.key === change.id) {
        const message: ServerSyncMessage = {
          type: 'entity-updated',
          subscriptionId: sub.subscriptionId,
          id: change.id,
          change: change.change,
          version,
        }
        this.dispatchEntityNotification(sub, message, registration)
      } else if (sub.type === 'collection') {
        this.scheduleCollectionEvaluation(sub, registration)
      }
    }
  }

  private dispatchRemoved(
    registration: ModelRegistration,
    change: Extract<EntityChange, { type: 'removed' }>,
    version: SyncVersion,
  ): void {
    for (const sub of this.subscriptions.values()) {
      if (sub.modelName !== registration.modelName) continue

      if (sub.type === 'entity' && sub.key === change.id) {
        const message: ServerSyncMessage = {
          type: 'entity-removed',
          subscriptionId: sub.subscriptionId,
          id: change.id,
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
      sub.currentSeq = this.lastSeqByModel.get(registration.modelName) ?? sub.currentSeq
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
    const currentSeq = this.lastSeqByModel.get(registration.modelName) ?? INITIAL_SEQ

    if (hasChanges) {
      this.sendMessage(sub.socket, {
        type: 'collection-snapshot',
        subscriptionId: sub.subscriptionId,
        data: results,
        totalCount,
        version: { seq: currentSeq, timestamp: new Date().toISOString() },
      })
    }

    sub.currentEntities = newEntities
    sub.lastTotalCount = totalCount
    sub.currentSeq = currentSeq
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
    lastSeq?: string,
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

    let subscriptionScope: Injector | undefined
    try {
      const subscriptionId = `sub-${++this.subscriptionCounter}`
      subscriptionScope = await this.captureSubscriptionScope(clientInjector)
      const currentSeq = this.lastSeqByModel.get(modelName) ?? INITIAL_SEQ

      if (lastSeq !== undefined) {
        const delta = await this.tryDeltaForEntity(registration, key, lastSeq)
        if (delta !== undefined) {
          this.storeEntitySubscription(subscriptionId, socket, subscriptionScope, modelName, key, currentSeq)
          this.sendMessage(socket, {
            type: 'subscribed',
            requestId,
            subscriptionId,
            model: modelName,
            mode: 'delta',
            changes: delta,
            version: { seq: currentSeq, timestamp: new Date().toISOString() },
          })
          return
        }
      }

      const entity = await registration.getEntity(subscriptionScope, key)

      this.storeEntitySubscription(subscriptionId, socket, subscriptionScope, modelName, key, currentSeq)

      this.sendMessage(socket, {
        type: 'subscribed',
        requestId,
        subscriptionId,
        model: modelName,
        mode: 'snapshot',
        data: entity,
        version: { seq: currentSeq, timestamp: new Date().toISOString() },
      })
    } catch (error) {
      if (subscriptionScope) {
        this.disposeSubscriptionScope(subscriptionScope)
      }
      this.sendMessage(socket, {
        type: 'subscription-error',
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Attempts to assemble a delta from the bus replay. Returns the entries
   * that match `key` when the bus retains the full gap from `lastSeq`,
   * `undefined` when the gap is too old (caller falls back to snapshot).
   *
   * Adapter-opaque seq tokens make a "is the next seq retained?" pre-check
   * impossible without an adapter-specific successor operation, so we lean
   * on the bus's own contract: {@link CrossNodeBus.replay} throws
   * synchronously with {@link ReplayWindowExceededError} when `lastSeq`
   * predates the retained window, which we map to the snapshot fallback.
   */
  private async tryDeltaForEntity(
    registration: ModelRegistration,
    key: unknown,
    lastSeq: string,
  ): Promise<SyncChangeEntry[] | undefined> {
    if (this.changeLog.oldestSeq(registration.modelName) === undefined) return undefined
    let iterable: AsyncIterable<SyncChangeEntry>
    try {
      iterable = this.changeLog.since(registration.modelName, lastSeq)
    } catch (error) {
      if (error instanceof ReplayWindowExceededError) return undefined
      throw error
    }
    const collected: SyncChangeEntry[] = []
    for await (const entry of iterable) {
      if (entry.type === 'added') {
        if ((entry.entity as Record<string, unknown>)[registration.primaryKey] === key) collected.push(entry)
      } else if (entry.id === key) {
        collected.push(entry)
      }
    }
    return collected
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

    let subscriptionScope: Injector | undefined
    try {
      const subscriptionId = `sub-${++this.subscriptionCounter}`
      subscriptionScope = await this.captureSubscriptionScope(clientInjector)

      const [results, totalCount] = await Promise.all([
        registration.findEntities(subscriptionScope, {
          filter,
          top,
          skip,
          order,
        }),
        registration.countEntities(subscriptionScope, filter),
      ])

      const currentEntities = new Map<unknown, unknown>()
      for (const entity of results) {
        const key = (entity as Record<string, unknown>)[registration.primaryKey]
        currentEntities.set(key, entity)
      }

      const currentSeq = this.lastSeqByModel.get(modelName) ?? INITIAL_SEQ

      const subscription: CollectionSubscription = {
        subscriptionId,
        socket,
        clientInjector: subscriptionScope,
        modelName,
        type: 'collection',
        filter,
        top,
        skip,
        order,
        currentSeq,
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
        version: { seq: currentSeq, timestamp: new Date().toISOString() },
      })
    } catch (error) {
      if (subscriptionScope) {
        this.disposeSubscriptionScope(subscriptionScope)
      }
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
    currentSeq: string,
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
      this.disposeSubscriptionScope(sub.clientInjector)
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
        const sub = this.subscriptions.get(subId)
        this.subscriptions.delete(subId)
        this.cleanupSubscriptionState(subId)
        if (sub) {
          this.disposeSubscriptionScope(sub.clientInjector)
        }
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
      currentSeq: this.lastSeqByModel.get(modelName) ?? INITIAL_SEQ,
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
    clearInterval(this.dedupTimer)
    for (const reg of this.modelRegistrations.values()) {
      for (const sub of reg.dataSetSubscriptions) {
        sub[Symbol.dispose]()
      }
      reg.busSubscription[Symbol.dispose]()
    }

    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }

    for (const sub of this.subscriptions.values()) {
      this.disposeSubscriptionScope(sub.clientInjector)
    }

    this.modelRegistrations.clear()
    this.subscriptions.clear()
    this.socketSubscriptionIds.clear()
    this.debounceTimers.clear()
    this.pendingEntityMessages.clear()
    this.queryCache.clear()
    this.lastSeqByModel.clear()
    this.dedup.clear()
  }
}

/**
 * DI token for the singleton {@link SubscriptionManager}.
 *
 * The factory creates a dedicated system-identity child scope that the
 * manager uses to resolve DataSets and subscribe to change events, and
 * also passes the owning injector so per-subscription scopes can be
 * spawned with the subscriber's captured identity (see
 * {@link SubscriptionManager.subscribeCollection}). Both scopes, and the
 * manager's internal state, are torn down when the owning injector is
 * disposed.
 */
export const SubscriptionManager: Token<SubscriptionManager, 'singleton'> = defineService({
  name: 'furystack/entity-sync-service/SubscriptionManager',
  lifetime: 'singleton',
  factory: ({ injector, inject, onDispose }): SubscriptionManager => {
    const systemInjector = useSystemIdentityContext({ injector, username: 'SubscriptionManager' })
    const entityChangeBus = inject(EntityChangeBus)
    const manager = new SubscriptionManagerImpl(systemInjector, injector, entityChangeBus)
    onDispose(async () => {
      // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
      manager[Symbol.dispose]()
      await systemInjector[Symbol.asyncDispose]()
    })
    return manager
  },
})
