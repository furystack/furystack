import { randomUUID } from 'node:crypto'
import {
  ReplayWindowExceededError,
  type BusMessage,
  type CrossNodeBus,
  type CrossNodeBusCapabilities,
  type CrossNodeBusTelemetry,
} from '@furystack/cross-node-bus'
import type { createClient } from 'redis'
import { compareRedisStreamId } from './compare-redis-stream-id.js'

type RedisLikeClient = ReturnType<typeof createClient>

/**
 * Options accepted by {@link RedisCrossNodeBus}.
 */
export type RedisCrossNodeBusOptions = {
  /**
   * Caller-owned `redis` client. Must be connected before the adapter is
   * used. The adapter `.duplicate()`s this client internally for the
   * blocking `XREAD` consumer loop and quits the duplicate on dispose; the
   * supplied client itself is never touched.
   */
  client: RedisLikeClient
  /**
   * Logical service name. Used in the default `nodeId` and in telemetry
   * attribution. Required so multi-service deployments are debuggable from
   * the broker side.
   */
  serviceName: string
  /**
   * Wire-level prefix applied to every topic on `publish` / `subscribe`.
   * Defaults to `''`. Multi-service deployments pick a distinct prefix per
   * service; cross-service subscribers use {@link CrossNodeBus.subscribeForeign}
   * with the foreign prefix.
   */
  topicPrefix?: string
  /**
   * Approximate `MAXLEN ~` per stream — Redis Streams trims around this
   * value (it can retain a few extra entries between trim cycles for
   * efficiency). Defaults to `10_000`.
   */
  replayWindow?: number
  /**
   * Stable per-process identifier. Defaults to `${serviceName}-${random}`.
   * Override for tests or deterministic ids.
   */
  nodeId?: string
  /**
   * Sink for `onCrossNodePublished` / `onCrossNodeReceived` /
   * `onCrossNodeError`. Wired through `defineRedisCrossNodeBusAdapter` in
   * the typical setup; also accepted directly for tests.
   */
  telemetry?: CrossNodeBusTelemetry
}

const CAPABILITIES: CrossNodeBusCapabilities = Object.freeze({
  persistent: true,
  replay: true,
  assignsSequence: true,
  crossNodeDelivery: true,
})

const DEFAULT_REPLAY_WINDOW = 10_000

/**
 * Approximate latency for new subscriptions to take effect on the wire.
 * The blocking `XREAD` is restarted whenever subscribers come or go; this
 * is the worst-case wait between calling `subscribe(...)` and the first
 * `XREAD` round including the new stream.
 */
const READ_LOOP_BLOCK_MS = 200

/**
 * Backoff applied between `XREAD` attempts after a transport error so a
 * disconnected Redis node does not produce a tight reconnect spin.
 */
const READ_LOOP_RETRY_BACKOFF_MS = 250

const READ_LOOP_TOPIC = '<read-loop>'

type LocalEntry = {
  handler: (message: BusMessage) => void
  /** Original topic the caller subscribed with — used for telemetry attribution. */
  displayTopic: string
}

type WireField = 'v' | 'originId' | 'emittedAt' | 'payload'

type WireMessage = Record<WireField, string>

type XInfoStreamReply = {
  lastGeneratedId?: string
  firstEntry?: { id: string } | null
}

type XReadStreamReply = Array<{
  name: string
  messages: Array<{ id: string; message: Record<string, string> }>
}>

type XRangeReply = Array<{ id: string; message: Record<string, string> }>

/**
 * Redis Streams adapter for {@link CrossNodeBus}. Persists messages on the
 * broker, assigns a server-monotonic `seq` (the stream entry id), and
 * supports replay within the configured {@link RedisCrossNodeBusOptions.replayWindow}.
 *
 * One stream is opened per wire topic (`${topicPrefix}${topic}`). A single
 * background read loop multiplexes `XREAD` across every subscribed stream,
 * so the number of Redis reader connections stays at one per adapter
 * regardless of subscriber count.
 *
 * **Subscribe semantics.** {@link RedisCrossNodeBus.subscribe} returns a
 * {@link Disposable} synchronously, but cursor initialization for that
 * topic happens asynchronously. Tests publishing immediately after
 * `subscribe` should `await bus.whenReady(topic)` first — production
 * subscribers usually register at boot and have plenty of time before the
 * first publish.
 */
export class RedisCrossNodeBus implements CrossNodeBus {
  public readonly nodeId: string
  public readonly capabilities: CrossNodeBusCapabilities = CAPABILITIES

  readonly #writeClient: RedisLikeClient
  readonly #readClient: RedisLikeClient
  readonly #topicPrefix: string
  readonly #replayWindow: number
  readonly #telemetry: CrossNodeBusTelemetry | undefined

  /** Local handlers per wire topic. Empty set means no subscribers on that wire. */
  readonly #localHandlers: Map<string, Set<LocalEntry>> = new Map()
  /** Last delivered stream id per wire topic — basis for the next `XREAD`. */
  readonly #cursors: Map<string, string> = new Map()
  /** Best-effort oldest retained id per wire topic. Backs the sync window check. */
  readonly #oldestSeqCache: Map<string, string | undefined> = new Map()
  /** Per-wire promise that resolves once cursor init for that wire has completed. */
  readonly #cursorReady: Map<string, Promise<void>> = new Map()

  #connectPromise: Promise<void> | undefined
  #readLoopPromise: Promise<void> | undefined
  #readLoopWakeup: (() => void) | undefined
  #disposed = false

  constructor(options: RedisCrossNodeBusOptions) {
    if (!options.serviceName || options.serviceName.length === 0) {
      throw new Error('RedisCrossNodeBus: `serviceName` is required')
    }
    const replayWindow = options.replayWindow ?? DEFAULT_REPLAY_WINDOW
    if (!Number.isInteger(replayWindow) || replayWindow <= 0) {
      throw new RangeError(
        `RedisCrossNodeBus: \`replayWindow\` must be a positive integer, got ${String(replayWindow)}`,
      )
    }
    this.#writeClient = options.client
    this.#readClient = options.client.duplicate()
    this.#topicPrefix = options.topicPrefix ?? ''
    this.#replayWindow = replayWindow
    this.nodeId = options.nodeId ?? `${options.serviceName}-${randomUUID().slice(0, 8)}`
    this.#telemetry = options.telemetry
    this.#connectPromise = this.#readClient
      .connect()
      .then(() => undefined)
      .catch((error) => {
        this.#telemetry?.emit('onCrossNodeError', { topic: READ_LOOP_TOPIC, error, phase: 'subscribe' })
      })
  }

  public async publish(topic: string, payload: unknown): Promise<void> {
    this.#ensureLive()
    const wire = this.#wireTopic(topic)
    let payloadJson: string
    try {
      const stringified = payload === undefined ? 'null' : JSON.stringify(payload)
      payloadJson = stringified === undefined ? 'null' : stringified
    } catch (error) {
      this.#telemetry?.emit('onCrossNodeError', { topic, error, phase: 'serialize' })
      throw error
    }
    const message: WireMessage = {
      v: '1',
      originId: this.nodeId,
      emittedAt: new Date().toISOString(),
      payload: payloadJson,
    }
    const byteLength = this.#telemetry ? Buffer.byteLength(payloadJson) : 0
    try {
      await this.#writeClient.xAdd(wire, '*', message, {
        TRIM: {
          strategy: 'MAXLEN',
          strategyModifier: '~',
          threshold: this.#replayWindow,
        },
      })
    } catch (error) {
      this.#telemetry?.emit('onCrossNodeError', { topic, error, phase: 'publish' })
      throw error
    }
    this.#telemetry?.emit('onCrossNodePublished', { topic, originId: this.nodeId, byteLength })
  }

  public subscribe(topic: string, handler: (message: BusMessage) => void): Disposable {
    this.#ensureLive()
    return this.#subscribeWire(this.#wireTopic(topic), topic, handler)
  }

  public subscribeRemoteOnly(topic: string, handler: (message: BusMessage) => void): Disposable {
    return this.subscribe(topic, (message) => {
      if (message.originId !== this.nodeId) handler(message)
    })
  }

  public subscribeForeign(prefix: string, topic: string, handler: (message: BusMessage) => void): Disposable {
    this.#ensureLive()
    return this.#subscribeWire(`${prefix}${topic}`, topic, handler)
  }

  public replay(topic: string, fromSeq: string): AsyncIterable<BusMessage> {
    this.#ensureLive()
    const wire = this.#wireTopic(topic)
    const cachedOldest = this.#oldestSeqCache.get(wire)
    if (cachedOldest !== undefined && compareRedisStreamId(fromSeq, cachedOldest) < 0) {
      const error = new ReplayWindowExceededError(topic, fromSeq, cachedOldest)
      this.#telemetry?.emit('onCrossNodeError', { topic, error, phase: 'replay' })
      throw error
    }
    return this.#streamReplay(topic, wire, fromSeq)
  }

  public compareSeq(a: string, b: string): number {
    return compareRedisStreamId(a, b)
  }

  public oldestSeq(topic: string): string | undefined {
    this.#ensureLive()
    return this.#oldestSeqCache.get(this.#wireTopic(topic))
  }

  /**
   * Resolves once the adapter has captured the initial cursor for `topic`
   * (or `prefix + topic` for foreign subscriptions). Tests publishing
   * back-to-back with `subscribe` should await this promise to defeat the
   * inherent subscribe race documented on {@link RedisCrossNodeBus}.
   */
  public async whenReady(topic: string, prefix?: string): Promise<void> {
    const wire = prefix !== undefined ? `${prefix}${topic}` : this.#wireTopic(topic)
    const ready = this.#cursorReady.get(wire)
    if (ready) await ready
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    this.#localHandlers.clear()
    this.#wakeReadLoop()
    try {
      this.#readClient.destroy()
    } catch {
      // Best-effort sync teardown; the async path quits cleanly.
    }
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    if (this.#disposed) return
    this.#disposed = true
    this.#localHandlers.clear()
    this.#wakeReadLoop()
    if (this.#readLoopPromise) {
      await this.#readLoopPromise.catch(() => undefined)
    }
    if (this.#readClient.isOpen) {
      try {
        await this.#readClient.quit()
      } catch {
        // Already torn down by the broker side; nothing to clean up.
      }
    }
  }

  #wireTopic(topic: string): string {
    return `${this.#topicPrefix}${topic}`
  }

  #subscribeWire(wire: string, displayTopic: string, handler: (message: BusMessage) => void): Disposable {
    const entry: LocalEntry = { handler, displayTopic }
    let handlers = this.#localHandlers.get(wire)
    const isFirstHandler = handlers === undefined
    if (!handlers) {
      handlers = new Set()
      this.#localHandlers.set(wire, handlers)
    }
    handlers.add(entry)
    if (isFirstHandler) {
      const ready = this.#initCursor(wire)
      this.#cursorReady.set(wire, ready)
      void ready.then(() => this.#ensureReadLoop())
    } else {
      this.#wakeReadLoop()
    }
    return {
      [Symbol.dispose]: () => {
        const current = this.#localHandlers.get(wire)
        if (!current) return
        current.delete(entry)
        if (current.size === 0) {
          this.#localHandlers.delete(wire)
          this.#cursors.delete(wire)
          this.#cursorReady.delete(wire)
          this.#wakeReadLoop()
        }
      },
    }
  }

  async #initCursor(wire: string): Promise<void> {
    if (this.#connectPromise) await this.#connectPromise
    if (this.#disposed) return
    let lastId = '0-0'
    let firstId: string | undefined
    try {
      const info = (await this.#writeClient.xInfoStream(wire)) as XInfoStreamReply
      lastId = info.lastGeneratedId ?? '0-0'
      firstId = info.firstEntry?.id
    } catch {
      // Stream does not exist yet; future XADDs will mint ids strictly
      // greater than '0-0', so we will see them on the next XREAD round.
    }
    if (this.#disposed) return
    if (!this.#localHandlers.has(wire)) return
    this.#cursors.set(wire, lastId)
    this.#oldestSeqCache.set(wire, firstId)
  }

  async *#streamReplay(topic: string, wire: string, fromSeq: string): AsyncIterable<BusMessage> {
    let cursor = fromSeq
    let oldestObserved: string | undefined
    while (true) {
      let entries: XRangeReply
      try {
        entries = await this.#writeClient.xRange(wire, `(${cursor}`, '+', { COUNT: 200 })
      } catch (error) {
        this.#telemetry?.emit('onCrossNodeError', { topic, error, phase: 'replay' })
        throw error
      }
      if (entries.length === 0) {
        if (oldestObserved !== undefined) this.#oldestSeqCache.set(wire, oldestObserved)
        return
      }
      for (const { id, message } of entries) {
        if (oldestObserved === undefined) oldestObserved = id
        yield this.#decode(id, message as WireMessage)
      }
      const lastEntry = entries[entries.length - 1]
      if (!lastEntry) return
      cursor = lastEntry.id
    }
  }

  #ensureReadLoop(): void {
    if (this.#readLoopPromise) {
      this.#wakeReadLoop()
      return
    }
    this.#readLoopPromise = this.#runReadLoop().catch((error) => {
      this.#telemetry?.emit('onCrossNodeError', { topic: READ_LOOP_TOPIC, error, phase: 'subscribe' })
    })
  }

  async #runReadLoop(): Promise<void> {
    if (this.#connectPromise) await this.#connectPromise
    while (!this.#disposed) {
      const wires: string[] = []
      const ids: string[] = []
      for (const [wire, handlers] of this.#localHandlers) {
        if (handlers.size === 0) continue
        const cursor = this.#cursors.get(wire)
        if (cursor === undefined) continue
        wires.push(wire)
        ids.push(cursor)
      }
      if (wires.length === 0) {
        await this.#sleepUntilWakeup()
        continue
      }
      let result: XReadStreamReply | null
      try {
        result = (await this.#readClient.xRead(
          wires.map((key, i) => ({ key, id: ids[i] ?? '$' })),
          { BLOCK: READ_LOOP_BLOCK_MS, COUNT: 200 },
        )) as XReadStreamReply | null
      } catch (error) {
        if (this.#disposed) return
        this.#telemetry?.emit('onCrossNodeError', { topic: READ_LOOP_TOPIC, error, phase: 'subscribe' })
        await new Promise((resolve) => setTimeout(resolve, READ_LOOP_RETRY_BACKOFF_MS))
        continue
      }
      if (!result) continue
      for (const { name: wire, messages } of result) {
        for (const { id, message } of messages) {
          this.#cursors.set(wire, id)
          if (this.#oldestSeqCache.get(wire) === undefined) {
            this.#oldestSeqCache.set(wire, id)
          }
          this.#deliver(wire, this.#decode(id, message as WireMessage))
        }
      }
    }
  }

  async #sleepUntilWakeup(): Promise<void> {
    if (this.#disposed) return
    await new Promise<void>((resolve) => {
      this.#readLoopWakeup = resolve
    })
    this.#readLoopWakeup = undefined
  }

  #wakeReadLoop(): void {
    const wake = this.#readLoopWakeup
    this.#readLoopWakeup = undefined
    if (wake) wake()
  }

  #deliver(wire: string, message: BusMessage): void {
    const handlers = this.#localHandlers.get(wire)
    if (!handlers || handlers.size === 0) return
    if (this.#telemetry) {
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

  #decode(id: string, message: WireMessage): BusMessage {
    let payload: unknown
    try {
      payload = JSON.parse(message.payload)
    } catch {
      payload = null
    }
    return {
      v: 1,
      originId: message.originId,
      emittedAt: message.emittedAt,
      seq: id,
      payload,
    }
  }

  #ensureLive(): void {
    if (this.#disposed) {
      throw new Error('RedisCrossNodeBus has been disposed')
    }
  }
}
