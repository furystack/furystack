import { ReplayWindowExceededError } from './errors.js'
import type { BusMessage } from './types.js'

/**
 * Options accepted by {@link MemoryBroker}.
 */
export type MemoryBrokerOptions = {
  /**
   * Maximum number of messages retained per topic for {@link MemoryBroker.replay}.
   * Defaults to `1000`. Must be a positive integer.
   */
  replayWindow?: number
}

const DEFAULT_REPLAY_WINDOW = 1000

type Handler = (message: BusMessage) => void

type TopicState = {
  /** Last assigned sequence as a number. Stored as `string` on the wire. */
  lastSeq: number
  /** Ring buffer ordered oldest → newest. Length is bounded by `replayWindow`. */
  buffer: BusMessage[]
  /** Subscribers receiving every message published on this topic. */
  handlers: Set<Handler>
}

/**
 * In-memory broker shared by one or more {@link InProcessCrossNodeBus}
 * instances. Owns the per-topic monotonic sequence counter, the bounded
 * replay buffer, and the subscriber registry.
 *
 * The default {@link CrossNodeBus} factory mints a private broker per bus,
 * so single-instance deployments behave like an isolated EventHub. The
 * testing harness shares a single broker across N buses so multi-node
 * scenarios can be exercised without spinning up an external transport.
 */
export class MemoryBroker implements Disposable {
  readonly #replayWindow: number
  readonly #topics: Map<string, TopicState> = new Map()
  #disposed = false

  constructor(options: MemoryBrokerOptions = {}) {
    const replayWindow = options.replayWindow ?? DEFAULT_REPLAY_WINDOW
    if (!Number.isInteger(replayWindow) || replayWindow <= 0) {
      throw new RangeError(`MemoryBroker.replayWindow must be a positive integer, got ${String(replayWindow)}`)
    }
    this.#replayWindow = replayWindow
  }

  public get replayWindow(): number {
    return this.#replayWindow
  }

  /**
   * Stamps `payload` with a fresh per-topic sequence and a publisher-side
   * `emittedAt`, retains the result in the ring buffer, then synchronously
   * fans out to every subscriber on `topic`.
   *
   * Subscriber exceptions are caught and routed to `onSubscriberError` so a
   * single faulty handler cannot interrupt fan-out to siblings or the bus
   * that hosts them.
   */
  public publish(
    topic: string,
    originId: string,
    payload: unknown,
    onSubscriberError?: (error: unknown, handler: Handler) => void,
  ): BusMessage {
    this.#ensureLive()
    const state = this.#getOrCreate(topic)
    state.lastSeq += 1
    const message: BusMessage = {
      v: 1,
      originId,
      emittedAt: new Date().toISOString(),
      seq: String(state.lastSeq),
      payload,
    }
    state.buffer.push(message)
    if (state.buffer.length > this.#replayWindow) {
      state.buffer.shift()
    }
    for (const handler of state.handlers) {
      try {
        handler(message)
      } catch (error) {
        if (onSubscriberError) {
          onSubscriberError(error, handler)
        } else {
          console.error('Unhandled MemoryBroker subscriber error', { topic, error })
        }
      }
    }
    return message
  }

  /**
   * Registers `handler` for every message published on `topic`. The returned
   * {@link Disposable} removes the handler on dispose.
   */
  public subscribe(topic: string, handler: Handler): Disposable {
    this.#ensureLive()
    const state = this.#getOrCreate(topic)
    state.handlers.add(handler)
    return {
      [Symbol.dispose]: () => {
        const current = this.#topics.get(topic)
        if (!current) return
        current.handlers.delete(handler)
        if (current.handlers.size === 0 && current.buffer.length === 0 && current.lastSeq === 0) {
          this.#topics.delete(topic)
        }
      },
    }
  }

  /**
   * Snapshot-then-stream replay. Validates the window synchronously: callers
   * see {@link ReplayWindowExceededError} before they iterate, which keeps
   * the fall-back-to-snapshot decision uniform with non-iterable failure
   * modes elsewhere in the framework.
   *
   * Iteration walks a frozen snapshot of the buffer captured at call time;
   * concurrent `publish` calls do not interleave into an in-flight replay.
   */
  public replay(topic: string, fromSeq: string): AsyncIterable<BusMessage> {
    this.#ensureLive()
    const fromSeqN = Number(fromSeq)
    if (!Number.isFinite(fromSeqN) || fromSeqN < 0) {
      throw new RangeError(`MemoryBroker.replay fromSeq must be a non-negative integer, got "${fromSeq}"`)
    }
    const state = this.#topics.get(topic)
    const buffer = state?.buffer ?? []
    const oldestRetained = buffer.length > 0 ? buffer[0].seq : undefined
    const oldestRetainedN = oldestRetained !== undefined ? Number(oldestRetained) : (state?.lastSeq ?? 0) + 1
    if (fromSeqN + 1 < oldestRetainedN) {
      throw new ReplayWindowExceededError(topic, fromSeq, oldestRetained)
    }
    const snapshot = buffer.filter((message) => Number(message.seq) > fromSeqN)
    return (async function* iterate(): AsyncIterable<BusMessage> {
      for (const message of snapshot) {
        yield message
      }
    })()
  }

  /**
   * Drops all retained messages, sequence counters, and subscribers. After
   * disposal every method throws — re-bind a fresh broker if you need one.
   */
  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    this.#topics.clear()
  }

  #ensureLive(): void {
    if (this.#disposed) {
      throw new Error('MemoryBroker has been disposed')
    }
  }

  #getOrCreate(topic: string): TopicState {
    let state = this.#topics.get(topic)
    if (!state) {
      state = { lastSeq: 0, buffer: [], handlers: new Set() }
      this.#topics.set(topic, state)
    }
    return state
  }
}
