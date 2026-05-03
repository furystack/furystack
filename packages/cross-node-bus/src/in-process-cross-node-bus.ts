import { randomUUID } from 'node:crypto'
import type { CrossNodeBusTelemetry } from './cross-node-bus-telemetry.js'
import { MemoryBroker } from './memory-broker.js'
import type { CrossNodeBus } from './cross-node-bus.js'
import type { BusMessage, CrossNodeBusCapabilities } from './types.js'

/**
 * Options accepted by {@link InProcessCrossNodeBus}.
 */
export type InProcessCrossNodeBusOptions = {
  /**
   * Shared {@link MemoryBroker}. When omitted a private broker is minted —
   * single-instance behavior matches an isolated EventHub. The testing
   * harness passes the same broker to N buses so they can observe each
   * other's publishes without an external transport.
   */
  broker?: MemoryBroker
  /** Stable, per-process identifier. Defaults to `local-${crypto.randomUUID()}`. */
  nodeId?: string
  /**
   * Wire-level prefix applied to every topic on `publish` / `subscribe`.
   * Defaults to `''` (no prefix). Multi-service simulations pick distinct
   * prefixes per bus so cross-service eavesdrop can be exercised against a
   * single shared broker.
   */
  topicPrefix?: string
  /**
   * Convenience for the common case of "one bus, fresh private broker, this
   * many retained messages per topic". Ignored when `broker` is provided.
   */
  replayWindow?: number
  /** Sink for `onCrossNodePublished` / `onCrossNodeReceived` / `onCrossNodeError`. */
  telemetry?: CrossNodeBusTelemetry
}

const CAPABILITIES: CrossNodeBusCapabilities = Object.freeze({
  persistent: false,
  replay: true,
  assignsSequence: true,
})

type LocalEntry = {
  handler: (message: BusMessage) => void
  /** Original topic the caller subscribed with — used for telemetry attribution. */
  displayTopic: string
}

/**
 * In-process default {@link CrossNodeBus} adapter. Backs single-node
 * deployments out of the box and powers the multi-instance testing harness
 * exposed at `@furystack/cross-node-bus/testing`.
 *
 * Local fan-out is multiplexed: regardless of how many handlers subscribe
 * to a single wire topic, the bus opens exactly one broker subscription and
 * dispatches arrivals to its own handler set. This keeps `onCrossNodeReceived`
 * counting one event per arrival rather than per handler invocation, and
 * mirrors the consumer-group shape future network adapters will use.
 */
export class InProcessCrossNodeBus implements CrossNodeBus {
  public readonly nodeId: string
  public readonly capabilities: CrossNodeBusCapabilities = CAPABILITIES

  readonly #broker: MemoryBroker
  readonly #ownsBroker: boolean
  readonly #topicPrefix: string
  readonly #telemetry: CrossNodeBusTelemetry | undefined

  /** displayTopic per wire topic — keyed by wire string for O(1) routing. */
  readonly #localHandlers: Map<string, Set<LocalEntry>> = new Map()
  /** Live broker subscription per wire topic, opened on first local handler. */
  readonly #brokerHandles: Map<string, Disposable> = new Map()

  #disposed = false

  constructor(options: InProcessCrossNodeBusOptions = {}) {
    this.#ownsBroker = options.broker === undefined
    this.#broker = options.broker ?? new MemoryBroker({ replayWindow: options.replayWindow })
    this.nodeId = options.nodeId ?? `local-${randomUUID()}`
    this.#topicPrefix = options.topicPrefix ?? ''
    this.#telemetry = options.telemetry
  }

  public async publish(topic: string, payload: unknown): Promise<void> {
    this.#ensureLive()
    const wire = this.#wireTopic(topic)
    let byteLength = 0
    if (this.#telemetry) {
      try {
        byteLength = Buffer.byteLength(JSON.stringify(payload) ?? '')
      } catch (error) {
        this.#telemetry.emit('onCrossNodeError', { topic, error, phase: 'serialize' })
      }
    }
    try {
      this.#broker.publish(wire, this.nodeId, payload, (error) => {
        this.#telemetry?.emit('onCrossNodeError', { topic, error, phase: 'subscribe' })
      })
    } catch (error) {
      this.#telemetry?.emit('onCrossNodeError', { topic, error, phase: 'publish' })
      throw error
    }
    this.#telemetry?.emit('onCrossNodePublished', { topic, originId: this.nodeId, byteLength })
  }

  public subscribe(topic: string, handler: (message: BusMessage) => void): Disposable {
    this.#ensureLive()
    return this.#subscribeWire(this.#wireTopic(topic), topic, handler, 'subscribe')
  }

  public subscribeRemoteOnly(topic: string, handler: (message: BusMessage) => void): Disposable {
    return this.subscribe(topic, (message) => {
      if (message.originId !== this.nodeId) handler(message)
    })
  }

  public subscribeForeign(prefix: string, topic: string, handler: (message: BusMessage) => void): Disposable {
    this.#ensureLive()
    return this.#subscribeWire(`${prefix}${topic}`, topic, handler, 'subscribeForeign')
  }

  public replay(topic: string, fromSeq: string): AsyncIterable<BusMessage> {
    this.#ensureLive()
    try {
      return this.#broker.replay(this.#wireTopic(topic), fromSeq)
    } catch (error) {
      this.#telemetry?.emit('onCrossNodeError', { topic, error, phase: 'replay' })
      throw error
    }
  }

  public compareSeq(a: string, b: string): number {
    return Number(a) - Number(b)
  }

  public oldestSeq(topic: string): string | undefined {
    this.#ensureLive()
    return this.#broker.oldestSeq(this.#wireTopic(topic))
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    for (const handle of this.#brokerHandles.values()) {
      handle[Symbol.dispose]()
    }
    this.#brokerHandles.clear()
    this.#localHandlers.clear()
    if (this.#ownsBroker) {
      this.#broker[Symbol.dispose]()
    }
  }

  #wireTopic(topic: string): string {
    return `${this.#topicPrefix}${topic}`
  }

  #subscribeWire(
    wire: string,
    displayTopic: string,
    handler: (message: BusMessage) => void,
    phase: 'subscribe' | 'subscribeForeign',
  ): Disposable {
    const entry: LocalEntry = { handler, displayTopic }
    let handlers = this.#localHandlers.get(wire)
    if (!handlers) {
      handlers = new Set()
      this.#localHandlers.set(wire, handlers)
      try {
        const brokerHandle = this.#broker.subscribe(wire, (message) => this.#deliver(wire, message))
        this.#brokerHandles.set(wire, brokerHandle)
      } catch (error) {
        this.#localHandlers.delete(wire)
        this.#telemetry?.emit('onCrossNodeError', { topic: displayTopic, error, phase })
        throw error
      }
    }
    handlers.add(entry)
    return {
      [Symbol.dispose]: () => {
        const current = this.#localHandlers.get(wire)
        if (!current) return
        current.delete(entry)
        if (current.size === 0) {
          this.#localHandlers.delete(wire)
          this.#brokerHandles.get(wire)?.[Symbol.dispose]()
          this.#brokerHandles.delete(wire)
        }
      },
    }
  }

  #deliver(wire: string, message: BusMessage): void {
    const handlers = this.#localHandlers.get(wire)
    if (!handlers || handlers.size === 0) return
    if (this.#telemetry) {
      // Multiple subscribers on the same wire share a displayTopic that maps
      // 1:1 to the wire string: `subscribe(t)` always yields prefix+t and
      // `subscribeForeign(p, t)` always yields p+t. The first entry's
      // displayTopic is therefore representative.
      const first = handlers.values().next().value
      if (first) {
        this.#telemetry.emit('onCrossNodeReceived', {
          topic: first.displayTopic,
          originId: message.originId,
          lagMs: Date.now() - Date.parse(message.emittedAt),
        })
      }
    }
    for (const entry of handlers) {
      try {
        entry.handler(message)
      } catch (error) {
        this.#telemetry?.emit('onCrossNodeError', { topic: entry.displayTopic, error, phase: 'subscribe' })
      }
    }
  }

  #ensureLive(): void {
    if (this.#disposed) {
      throw new Error('InProcessCrossNodeBus has been disposed')
    }
  }
}
