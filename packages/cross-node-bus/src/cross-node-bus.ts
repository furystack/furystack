import { defineService, type Token } from '@furystack/inject'
import { defineInProcessCrossNodeBus } from './define-in-process-cross-node-bus.js'
import type { BusMessage, CrossNodeBusCapabilities } from './types.js'

/**
 * Transport-agnostic publish/subscribe primitive. Implementations talk to a
 * concrete broker (in-process map, Redis Streams, …); facades layer typed
 * event contracts on top.
 *
 * Self-delivery is on by default — a publisher receives its own messages.
 * Subscribers that need a local-vs-remote distinction either filter on
 * `message.originId === bus.nodeId` or use
 * {@link CrossNodeBus.subscribeRemoteOnly}.
 */
export interface CrossNodeBus extends Disposable {
  /** Stable, unique id of this node. Included in every published message. */
  readonly nodeId: string

  /** Static description of what this adapter can do. */
  readonly capabilities: CrossNodeBusCapabilities

  /**
   * Publishes `payload` on `topic`. Resolves once the message has been
   * accepted by the underlying transport (not when it has been delivered to
   * all subscribers).
   */
  publish(topic: string, payload: unknown): Promise<void>

  /**
   * Subscribes to every message published on `topic`, including ones
   * originating from this node.
   */
  subscribe(topic: string, handler: (message: BusMessage) => void): Disposable

  /**
   * Convenience for the common "I only care about messages from other nodes"
   * pattern. Equivalent to {@link CrossNodeBus.subscribe} + filter on
   * `message.originId !== bus.nodeId`.
   */
  subscribeRemoteOnly(topic: string, handler: (message: BusMessage) => void): Disposable

  /**
   * Subscribe to a topic owned by another `topicPrefix`. Explicit, greppable
   * cross-service eavesdrop. Adapters that lack the underlying capability
   * throw at registration time.
   */
  subscribeForeign(prefix: string, topic: string, handler: (message: BusMessage) => void): Disposable

  /**
   * Replay messages on `topic` whose `seq` is greater than `fromSeq`. Throws
   * synchronously when {@link CrossNodeBusCapabilities.replay} is `false` or
   * when `fromSeq` is older than the adapter's retained window — facades
   * fall back to a full snapshot in the latter case.
   */
  replay(topic: string, fromSeq: string): AsyncIterable<BusMessage>

  /**
   * Compares two adapter-issued seq tokens from the **same topic**. Returns a
   * negative number when `a` precedes `b`, zero when equal, a positive number
   * when `a` follows `b`. Facades use this for dedup and "have we seen newer?"
   * checks without leaking the adapter-specific seq encoding.
   *
   * Behavior across topics, adapters, or for tokens this adapter never issued
   * is undefined.
   */
  compareSeq(a: string, b: string): number

  /**
   * Returns the oldest retained seq for `topic`, or `undefined` when nothing
   * is currently retained. Throws synchronously when
   * {@link CrossNodeBusCapabilities.replay} is `false`. Facades use this to
   * decide whether a delta replay is feasible before calling
   * {@link CrossNodeBus.replay}.
   */
  oldestSeq(topic: string): string | undefined
}

/**
 * Shared {@link CrossNodeBus} token. Resolves an `InProcessCrossNodeBus` by
 * default — single-node deployments work without configuration. Multi-node
 * deployments override the binding with a transport adapter, e.g.
 * `defineRedisCrossNodeBusAdapter({ … })`.
 *
 * Singleton: a single bus per injector tree is the right semantic for
 * cross-process publish/subscribe. Tests get isolation by minting their own
 * root injector with `createInjector()`.
 */
export const CrossNodeBus: Token<CrossNodeBus, 'singleton'> = defineService({
  name: 'furystack/cross-node-bus/CrossNodeBus',
  lifetime: 'singleton',
  factory: defineInProcessCrossNodeBus(),
})
