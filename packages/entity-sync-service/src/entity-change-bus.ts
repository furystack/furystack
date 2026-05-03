import { CrossNodeBus, type BusMessage } from '@furystack/cross-node-bus'
import type { SyncVersion } from '@furystack/entity-sync'
import { defineService, type Token } from '@furystack/inject'

/**
 * Wire-format prefix every {@link EntityChangeBus} topic gets stamped with on
 * the underlying {@link CrossNodeBus}. One topic per registered model
 * (`entity/${modelName}`) gives every model its own monotonic seq + replay
 * window for free, mirroring the consumer-group shape future networked
 * adapters will use.
 */
const TOPIC_PREFIX = 'entity/'

/**
 * Maps a model name to the wire topic the {@link EntityChangeBus} publishes
 * and subscribes to on the underlying {@link CrossNodeBus}. Exported so
 * adjacent helpers (e.g. `ChangeLog`) can derive the same string from one
 * source of truth.
 */
export const topicForModel = (modelName: string): string => `${TOPIC_PREFIX}${modelName}`

/**
 * Discriminated union of cross-node entity changes. Mirrors the lifecycle of
 * the underlying {@link DataSet} (`onEntityAdded` / `onEntityUpdated` /
 * `onEntityRemoved`) but is kept transport-agnostic — `version` and
 * `originId` are stamped by the bus on receive, not by the publisher.
 *
 * `added` carries the primary-key value (not the field name) so receivers do
 * not need to depend on registration order with the publisher: a node that
 * has not yet called `registerModel` for the model can still match the
 * change against an existing subscription once registration arrives.
 */
export type EntityChange =
  | { type: 'added'; entity: unknown; primaryKey: unknown }
  | { type: 'updated'; id: unknown; change: Record<string, unknown> }
  | { type: 'removed'; id: unknown }

/**
 * What every {@link EntityChangeBus} subscriber receives — the {@link EntityChange}
 * plus the bus-stamped {@link SyncVersion} (derived from `BusMessage.seq` +
 * `emittedAt`) and the publisher's `originId`. The broadcaster needs all
 * three to (a) build the outbound `ServerSyncMessage`, (b) dedup retransmits,
 * and (c) update its per-model last-seen seq.
 */
export type EntityChangeEnvelope = {
  /** The model the change applies to. */
  modelName: string
  /** The change payload. */
  change: EntityChange
  /** Adapter-assigned version (opaque, ordered seq + ISO timestamp). */
  version: SyncVersion
  /** `nodeId` of the publishing bus. */
  originId: string
}

/**
 * Cross-node entity-change facade. Bridges the per-process
 * `dataSet.subscribe('onEntityAdded'|'onEntityUpdated'|'onEntityRemoved', …)`
 * fan-out to the shared {@link CrossNodeBus}, so writes on node A wake every
 * matching subscription on every sibling node, not just the originator.
 *
 * **Single fan-out path.** Unlike `IdentityEventBus`, this facade uses plain
 * `subscribe` (not `subscribeRemoteOnly`): the broadcaster needs the
 * bus-assigned seq before it can stamp `version` on outbound
 * `ServerSyncMessage`s. Letting own publishes round-trip through the bus is
 * the only way to get that seq; the receive handler is the single place
 * that builds `ServerSyncMessage`s.
 *
 * **Capability requirements.** The factory throws when the bound
 * {@link CrossNodeBus} lacks `replay` or `assignsSequence` — facades never
 * silently degrade. Reconnecting clients depend on `bus.replay` for delta
 * sync; broadcasters depend on `bus.compareSeq` for dedup; both require
 * adapter-assigned seq tokens.
 */
export interface EntityChangeBus extends Disposable {
  /**
   * Publishes a typed entity change for `modelName`. Resolves once the
   * underlying transport has accepted the message — does **not** wait for
   * fan-out to subscribers.
   */
  publish(modelName: string, change: EntityChange): Promise<void>

  /**
   * Subscribes to every change published for `modelName`, including the
   * ones originating on this node. The handler receives an envelope with
   * the bus-stamped {@link SyncVersion} and `originId` so callers can dedup
   * by `(modelName, originId)`.
   */
  subscribe(modelName: string, handler: (envelope: EntityChangeEnvelope) => void): Disposable

  /**
   * The underlying {@link CrossNodeBus} this facade is bound to. Exposed so
   * internal callers (`ChangeLog`, `SubscriptionManager`) reuse `compareSeq`,
   * `replay`, and `oldestSeq` against the same adapter without re-resolving
   * the token.
   */
  readonly bus: CrossNodeBus
}

const isEntityChange = (value: unknown): value is EntityChange => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { type?: unknown }
  switch (candidate.type) {
    case 'added':
      return 'entity' in candidate && 'primaryKey' in candidate
    case 'updated':
      return (
        'id' in candidate &&
        'change' in candidate &&
        typeof (candidate as { change: unknown }).change === 'object' &&
        (candidate as { change: unknown }).change !== null
      )
    case 'removed':
      return 'id' in candidate
    default:
      return false
  }
}

class EntityChangeBusImpl implements EntityChangeBus {
  public readonly bus: CrossNodeBus
  readonly #handlers: Map<string, Set<(env: EntityChangeEnvelope) => void>> = new Map()
  readonly #subscriptions: Map<string, Disposable> = new Map()
  #disposed = false

  constructor(bus: CrossNodeBus) {
    if (!bus.capabilities.replay || !bus.capabilities.assignsSequence) {
      throw new Error(
        `EntityChangeBus requires a CrossNodeBus with capabilities { replay: true, assignsSequence: true }; got ${JSON.stringify(
          bus.capabilities,
        )}`,
      )
    }
    this.bus = bus
  }

  public async publish(modelName: string, change: EntityChange): Promise<void> {
    this.#ensureLive()
    await this.bus.publish(topicForModel(modelName), change)
  }

  public subscribe(modelName: string, handler: (envelope: EntityChangeEnvelope) => void): Disposable {
    this.#ensureLive()
    let handlers = this.#handlers.get(modelName)
    if (!handlers) {
      handlers = new Set()
      this.#handlers.set(modelName, handlers)
      const sub = this.bus.subscribe(topicForModel(modelName), (message) => this.#dispatch(modelName, message))
      this.#subscriptions.set(modelName, sub)
    }
    handlers.add(handler)
    return {
      [Symbol.dispose]: () => {
        const current = this.#handlers.get(modelName)
        if (!current) return
        current.delete(handler)
        if (current.size === 0) {
          this.#handlers.delete(modelName)
          this.#subscriptions.get(modelName)?.[Symbol.dispose]()
          this.#subscriptions.delete(modelName)
        }
      },
    }
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    for (const sub of this.#subscriptions.values()) sub[Symbol.dispose]()
    this.#subscriptions.clear()
    this.#handlers.clear()
  }

  #dispatch(modelName: string, message: BusMessage): void {
    if (message.seq === undefined) return
    if (!isEntityChange(message.payload)) return
    const envelope: EntityChangeEnvelope = {
      modelName,
      change: message.payload,
      version: { seq: message.seq, timestamp: message.emittedAt },
      originId: message.originId,
    }
    const handlers = this.#handlers.get(modelName)
    if (!handlers) return
    // Snapshot so a handler that disposes its own subscription mid-emit can't
    // mutate the iterator. Listener errors are isolated per-handler — one
    // throwing handler must not poison its peers or starve the bus.
    for (const handler of [...handlers]) {
      try {
        handler(envelope)
      } catch (error) {
        console.error('EntityChangeBus listener threw', { modelName, error })
      }
    }
  }

  #ensureLive(): void {
    if (this.#disposed) {
      throw new Error('EntityChangeBus has been disposed')
    }
  }
}

/**
 * Singleton DI token for the {@link EntityChangeBus}. Resolves a facade bound
 * to the injector's {@link CrossNodeBus} — apps that have not bound a
 * transport adapter run against the in-process default and single-node
 * deployments work without configuration.
 *
 * The factory throws synchronously when the bound bus lacks `replay` or
 * `assignsSequence`; entity sync depends on adapter-assigned monotonic ids
 * for delta replay and server-side dedup. There is no silent degradation.
 */
export const EntityChangeBus: Token<EntityChangeBus, 'singleton'> = defineService({
  name: 'furystack/entity-sync-service/EntityChangeBus',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }): EntityChangeBus => {
    const bus = inject(CrossNodeBus)
    const impl = new EntityChangeBusImpl(bus)
    onDispose(() => {
      // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
      impl[Symbol.dispose]()
    })
    return impl
  },
})
