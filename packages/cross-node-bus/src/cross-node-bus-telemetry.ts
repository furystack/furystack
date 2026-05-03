import { defineService, type Token } from '@furystack/inject'
import { EventHub, type ListenerErrorPayload } from '@furystack/utils'

/**
 * Phase of the bus pipeline an `onCrossNodeError` event refers to. `serialize`
 * is reserved for future adapters that fail when JSON-encoding payloads;
 * the in-process default never produces it.
 */
export type CrossNodeBusErrorPhase = 'publish' | 'subscribe' | 'subscribeForeign' | 'replay' | 'serialize'

/**
 * Union of telemetry signals emitted by every {@link CrossNodeBus} adapter.
 * Each adapter forwards into the same hub so subscribers can observe the
 * whole bus surface from one place — independent of which transport is
 * bound.
 */
export type CrossNodeBusTelemetryEvents = {
  /** Fired after a message has been accepted by the transport. */
  onCrossNodePublished: { topic: string; originId: string; byteLength: number }
  /**
   * Fired once per message arriving at the bus, before local fan-out.
   * `lagMs = Date.now() - Date.parse(message.emittedAt)`; clock skew can
   * produce negative values, which adapters report verbatim.
   */
  onCrossNodeReceived: { topic: string; originId: string; lagMs: number }
  onCrossNodeError: { topic: string; error: unknown; phase: CrossNodeBusErrorPhase }
  /**
   * Fired when an adapter that owns its replay buffer drops a retained
   * message to honor the configured replay window. Operators alert on the
   * trend so the window can be tuned before reconnecting clients start
   * hitting `ReplayWindowExceededError`.
   *
   * Only adapters that own the buffer emit this signal — today that is
   * {@link InProcessCrossNodeBus} via {@link MemoryBroker}. Network-broker
   * adapters that delegate trimming to the broker (Redis Streams' `MAXLEN`,
   * NATS JetStream's max-bytes) cannot observe individual evictions on the
   * client side; consumers needing that signal should read it from the
   * broker's native metrics (e.g. `redis_streams_length` from the Prom
   * exporter).
   */
  onCrossNodeWindowEvicted: { topic: string; evictedSeq: string; retainedCount: number }
  onListenerError: ListenerErrorPayload
}

/**
 * Application-facing telemetry surface for the cross-node bus. Subscribers
 * use the standard {@link EventHub} `addListener` / `subscribe` API.
 */
export class CrossNodeBusTelemetry extends EventHub<CrossNodeBusTelemetryEvents> {}

/**
 * DI token for the shared {@link CrossNodeBusTelemetry} instance.
 *
 * Singleton because the bus token itself is singleton — co-locating both at
 * the root injector keeps every override factory (including transport
 * adapters) free to inject telemetry without lifetime-compatibility
 * gymnastics. Each test still gets isolation by minting its own root
 * injector with `createInjector()`.
 */
export const CrossNodeBusTelemetryToken: Token<CrossNodeBusTelemetry, 'singleton'> = defineService({
  name: 'furystack/cross-node-bus/CrossNodeBusTelemetry',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const telemetry = new CrossNodeBusTelemetry()
    // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
    onDispose(() => telemetry[Symbol.dispose]())
    return telemetry
  },
})
