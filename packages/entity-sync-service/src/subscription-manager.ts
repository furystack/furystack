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

type ModelRegistration = {
  model: Constructable<unknown>
  modelName: string
  primaryKey: string
  currentSeq: number
  changelog: SyncChangeEntry[]
  changelogRetentionMs: number
  eventSubscriptions: Disposable[]
  getEntity: (injector: Injector, key: unknown) => Promise<unknown>
}

/**
 * Options for model registration
 */
export type ModelSyncOptions = {
  /** How long to keep change entries for delta sync (default: 5 minutes) */
  changelogRetentionMs?: number
}

/**
 * Manages entity subscriptions and dispatches changes to connected WebSocket clients.
 * Tracks a per-model changelog with sequence numbers for delta sync support.
 */
@Injectable({ lifetime: 'singleton' })
export class SubscriptionManager implements Disposable {
  private readonly modelRegistrations = new Map<string, ModelRegistration>()
  private readonly subscriptions = new Map<string, EntitySubscription>()
  private readonly socketSubscriptionIds = new Map<WebSocket, Set<string>>()
  private subscriptionCounter = 0

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
      eventSubscriptions: [],
      getEntity: (injector, key) => dataSet.get(injector, key as T[TPrimaryKey]),
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
      if (sub.modelName === modelName && sub.type === 'entity' && sub.key === entityKey) {
        this.sendMessage(sub.socket, {
          type: 'entity-added',
          subscriptionId: sub.subscriptionId,
          entity,
          version,
        })
        sub.currentSeq = version.seq
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
      if (sub.modelName === modelName && sub.type === 'entity' && sub.key === id) {
        this.sendMessage(sub.socket, {
          type: 'entity-updated',
          subscriptionId: sub.subscriptionId,
          id,
          change,
          version,
        })
        sub.currentSeq = version.seq
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
      if (sub.modelName === modelName && sub.type === 'entity' && sub.key === key) {
        this.sendMessage(sub.socket, {
          type: 'entity-removed',
          subscriptionId: sub.subscriptionId,
          id: key,
          version,
        })
        sub.currentSeq = version.seq
      }
    }
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

          this.storeSubscription(subscriptionId, socket, clientInjector, modelName, key, registration.currentSeq)

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

      this.storeSubscription(subscriptionId, socket, clientInjector, modelName, key, registration.currentSeq)

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

  private storeSubscription(
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
    }
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
  public getActiveSubscriptions(): Array<{ subscriptionId: string; modelName: string; key: unknown }> {
    return [...this.subscriptions.values()].map((sub) => ({
      subscriptionId: sub.subscriptionId,
      modelName: sub.modelName,
      key: sub.key,
    }))
  }

  public [Symbol.dispose](): void {
    for (const reg of this.modelRegistrations.values()) {
      for (const sub of reg.eventSubscriptions) {
        sub[Symbol.dispose]()
      }
    }
    this.modelRegistrations.clear()
    this.subscriptions.clear()
    this.socketSubscriptionIds.clear()
  }

  @Injected(Repository)
  declare private readonly repository: Repository
}
