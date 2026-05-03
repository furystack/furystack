import { CrossNodeBus, type BusMessage } from '@furystack/cross-node-bus'
import { defineService, type Token } from '@furystack/inject'
import { sessionCacheKey } from './identity-cache-keys.js'
import { UserResolutionCache } from './user-resolution-cache.js'

/**
 * Wire topic the facade publishes to and subscribes from on the underlying
 * {@link CrossNodeBus}. A single topic is used for all event types — internal
 * dispatch happens by `event.type`. Keeping one topic minimises broker
 * subscriptions on networked adapters (Redis Streams, NATS) and matches the
 * EventHub-style fan-out apps already use.
 */
export const IDENTITY_EVENT_TOPIC = 'identity/events'

/**
 * Discriminated union of cross-node identity events. Adding a new variant
 * **must** also extend {@link applyLocalIdentityInvalidation} so the local
 * cache stays in sync with the published intent.
 *
 * - `userLoggedOut` / `sessionInvalidated` invalidate the cache entry for a
 *   single session id (same shape — `sessionInvalidated` is meant for
 *   admin / forced flows where a session row is dropped server-side).
 * - `userRolesChanged` / `userDeleted` / `passwordChanged` invalidate every
 *   cached entry that resolved to the named user, regardless of which
 *   session originally populated it.
 */
export type IdentityEvent =
  | { type: 'userLoggedOut'; sessionId: string }
  | { type: 'sessionInvalidated'; sessionId: string }
  | { type: 'userRolesChanged'; username: string }
  | { type: 'userDeleted'; username: string }
  | { type: 'passwordChanged'; username: string }

/**
 * Cross-node identity event facade. Bridges the per-process
 * {@link UserResolutionCache} to the shared {@link CrossNodeBus} so that
 * logouts, role flips, password resets and account deletions invalidate
 * cached identities across every node, not just the one that originated
 * the change.
 *
 * Publishing collapses the staleness window from `userCacheTtlMs`
 * (default 30 s) to bus latency (single-digit ms with Redis pub/sub).
 *
 * **Self-delivery contract.** {@link IdentityEventBus.publish} applies the
 * matching local invalidation and fires local subscribers synchronously
 * **before** awaiting the bus. Sibling nodes receive the message via a
 * `subscribeRemoteOnly` bridge — own publishes never round-trip through the
 * transport, so duplicate work is impossible.
 *
 * @example
 * ```ts
 * import type { Injector } from '@furystack/inject'
 * import { IdentityEventBus } from '@furystack/rest-service'
 *
 * declare const injector: Injector
 * const bus = injector.get(IdentityEventBus)
 *
 * using sub = bus.subscribe('userRolesChanged', ({ username }) => {
 *   console.log('roles changed for', username)
 * })
 *
 * await bus.publish({ type: 'userRolesChanged', username: 'alice' })
 * ```
 */
export interface IdentityEventBus extends Disposable {
  /**
   * Publishes a typed identity event. Applies the matching local cache
   * invalidation synchronously, fires local subscribers synchronously, then
   * awaits the underlying bus broadcast. Resolves once the message has been
   * accepted by the transport.
   */
  publish(event: IdentityEvent): Promise<void>

  /**
   * Subscribes to a single event type. Local emits and bus-delivered messages
   * from sibling nodes both fire the handler. Returns a `Disposable` that
   * removes the listener on dispose.
   */
  subscribe<TType extends IdentityEvent['type']>(
    type: TType,
    handler: (event: Extract<IdentityEvent, { type: TType }>) => void,
  ): Disposable
}

/**
 * Applies the cache invalidation that corresponds to `event` against
 * `userCache`. Centralised so the publish path and the remote-receive path
 * cannot drift — both call this single helper. Exported for the rare
 * subsystem (e.g. websocket-api logout-driven socket close) that consumes
 * an {@link IdentityEvent} and needs to mirror the cache effect.
 */
export const applyLocalIdentityInvalidation = (event: IdentityEvent, userCache: UserResolutionCache): void => {
  switch (event.type) {
    case 'userLoggedOut':
    case 'sessionInvalidated':
      userCache.invalidate(sessionCacheKey(event.sessionId))
      return
    case 'userRolesChanged':
    case 'userDeleted':
    case 'passwordChanged':
      userCache.invalidateByUser(event.username)
      return
    default: {
      // Exhaustiveness check: every variant of {@link IdentityEvent} above
      // must be handled. Adding a new variant without updating this switch
      // will fail to compile.
      const _exhaustive: never = event
      void _exhaustive
    }
  }
}

const isIdentityEvent = (value: unknown): value is IdentityEvent => {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as { type?: unknown; sessionId?: unknown; username?: unknown }
  switch (candidate.type) {
    case 'userLoggedOut':
    case 'sessionInvalidated':
      return typeof candidate.sessionId === 'string'
    case 'userRolesChanged':
    case 'userDeleted':
    case 'passwordChanged':
      return typeof candidate.username === 'string'
    default:
      return false
  }
}

type AnyIdentityHandler = (event: IdentityEvent) => void

class IdentityEventBusImpl implements IdentityEventBus {
  readonly #bus: CrossNodeBus
  readonly #userCache: UserResolutionCache
  readonly #handlers: Map<IdentityEvent['type'], Set<AnyIdentityHandler>> = new Map()
  readonly #busSubscription: Disposable
  #disposed = false

  constructor(bus: CrossNodeBus, userCache: UserResolutionCache) {
    this.#bus = bus
    this.#userCache = userCache
    // subscribeRemoteOnly: own publishes invalidate locally inline, so we
    // only handle messages originating on sibling nodes here.
    this.#busSubscription = bus.subscribeRemoteOnly(IDENTITY_EVENT_TOPIC, (message) => this.#receive(message))
  }

  public async publish(event: IdentityEvent): Promise<void> {
    if (this.#disposed) {
      throw new Error('IdentityEventBus has been disposed')
    }
    applyLocalIdentityInvalidation(event, this.#userCache)
    this.#emit(event)
    await this.#bus.publish(IDENTITY_EVENT_TOPIC, event)
  }

  public subscribe<TType extends IdentityEvent['type']>(
    type: TType,
    handler: (event: Extract<IdentityEvent, { type: TType }>) => void,
  ): Disposable {
    let handlers = this.#handlers.get(type)
    if (!handlers) {
      handlers = new Set()
      this.#handlers.set(type, handlers)
    }
    const wrapped: AnyIdentityHandler = (event) => handler(event as Extract<IdentityEvent, { type: TType }>)
    handlers.add(wrapped)
    return {
      [Symbol.dispose]: () => {
        const current = this.#handlers.get(type)
        if (!current) return
        current.delete(wrapped)
        if (current.size === 0) this.#handlers.delete(type)
      },
    }
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    this.#busSubscription[Symbol.dispose]()
    this.#handlers.clear()
  }

  #receive(message: BusMessage): void {
    const { payload } = message
    if (!isIdentityEvent(payload)) {
      // Foreign or future-version messages are silently ignored — older nodes
      // see new event types as no-ops, which is the documented dual-accept
      // behaviour from the cross-node-bus PRD §12.
      return
    }
    applyLocalIdentityInvalidation(payload, this.#userCache)
    this.#emit(payload)
  }

  #emit(event: IdentityEvent): void {
    const handlers = this.#handlers.get(event.type)
    if (!handlers) return
    // Snapshot so a handler that disposes its own subscription mid-emit can't
    // mutate the iterator. Listener errors are isolated per-handler and
    // logged — one throwing handler must not poison its peers.
    for (const handler of [...handlers]) {
      try {
        handler(event)
      } catch (error) {
        console.error('IdentityEventBus listener threw', { type: event.type, error })
      }
    }
  }
}

/**
 * Singleton DI token for the {@link IdentityEventBus}. Resolves a facade that
 * shares the injector's {@link CrossNodeBus} binding — apps that have not
 * bound a transport adapter run against the in-process default and
 * single-node deployments work without configuration.
 */
export const IdentityEventBus: Token<IdentityEventBus, 'singleton'> = defineService({
  name: 'furystack/rest-service/IdentityEventBus',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }): IdentityEventBus => {
    const bus = inject(CrossNodeBus)
    const userCache = inject(UserResolutionCache)
    const impl = new IdentityEventBusImpl(bus, userCache)
    onDispose(() => {
      // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
      impl[Symbol.dispose]()
    })
    return impl
  },
})
