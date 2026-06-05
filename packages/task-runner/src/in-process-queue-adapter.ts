import type {
  ClaimedTask,
  ClaimOutcome,
  EnqueueInput,
  IdempotencyLeaseInput,
  QueueAdapter,
  QueueAdapterCapabilities,
  WorkerSubscription,
} from './queue-adapter.js'
import { workerSatisfiesTags } from './queue-adapter.js'

type PendingEntry = {
  taskId: string
  type: string
  handlerVersion: number
  notBefore?: number
  tags: readonly string[]
}

type IdempotencyLease = {
  taskId: string
  expiresAt: number
}

const DEFAULT_IDEMPOTENCY_TTL_SEC = 86_400

export type InProcessQueueAdapterOptions = {
  /**
   * Process-wide max-concurrent claims per task type. Types absent from
   * the map are uncapped. Enforced in-process via a per-type live
   * counter — the single-process analogue of the Redis adapter's
   * broker-side ZSET cap.
   */
  concurrencyLimits?: Record<string, number>
  /**
   * Idempotency-lease TTL (seconds). A `(type, key)` lease older than
   * this is treated as expired so a later submit can win it. Default 24h,
   * matching `@furystack/redis-task-runner`.
   */
  idempotencyTtlSec?: number
}

const CAPABILITIES: QueueAdapterCapabilities = Object.freeze({
  persistent: false,
  distributed: false,
  delayedDispatch: true,
  fleetCapEnforcement: true,
  brokerSideReclaim: false,
})

/**
 * In-process implementation of {@link QueueAdapter}. Holds per-type
 * FIFO queues in memory and serves concurrent claim slots via a set of
 * `Promise`-based waiters (one per parked slot), all woken on any change.
 * No persistence — tasks lost on restart are recovered through the runner
 * core's dataset-based reconciler (PRD §7.4).
 *
 * Supports the same optional features the Redis adapter does, scoped to
 * one process: tag-constrained claims, a per-type concurrency cap, and
 * TTL'd idempotency leases.
 */
export class InProcessQueueAdapter implements QueueAdapter {
  public readonly capabilities: QueueAdapterCapabilities = CAPABILITIES

  readonly #queues = new Map<string, PendingEntry[]>()
  readonly #subscriptions = new Set<WorkerSubscription>()
  readonly #subscriptionAborts = new Map<WorkerSubscription, AbortController>()
  readonly #idempotencyLeases = new Map<string, IdempotencyLease>()
  readonly #liveByType = new Map<string, number>()
  readonly #concurrencyLimits: Record<string, number>
  readonly #idempotencyTtlSec: number

  readonly #waiters = new Set<() => void>()
  #notBeforeTimer: ReturnType<typeof setTimeout> | undefined
  #disposed = false

  constructor(options?: InProcessQueueAdapterOptions) {
    this.#concurrencyLimits = options?.concurrencyLimits ?? {}
    this.#idempotencyTtlSec = options?.idempotencyTtlSec ?? DEFAULT_IDEMPOTENCY_TTL_SEC
  }

  // ── Public API ────────────────────────────────────────────────────

  public async enqueue(input: EnqueueInput): Promise<void> {
    if (this.#disposed) return
    const entry: PendingEntry = {
      taskId: input.taskId,
      type: input.type,
      handlerVersion: input.handlerVersion,
      notBefore: input.notBefore?.getTime(),
      tags: input.tags ?? [],
    }
    let q = this.#queues.get(input.type)
    if (!q) {
      q = []
      this.#queues.set(input.type, q)
    }
    q.push(entry)
    this.#wake()
    this.#scheduleNotBeforeWake()
  }

  public subscribe(subscription: WorkerSubscription): Disposable {
    if (this.#disposed) {
      throw new Error('InProcessQueueAdapter has been disposed')
    }
    this.#subscriptions.add(subscription)
    const ac = new AbortController()
    this.#subscriptionAborts.set(subscription, ac)
    for (let i = 0; i < subscription.concurrency; i++) {
      void this.#runSlot(subscription, ac.signal)
    }
    this.#wake()
    return {
      [Symbol.dispose]: () => {
        ac.abort()
        this.#subscriptions.delete(subscription)
        this.#subscriptionAborts.delete(subscription)
        this.#wake()
      },
    }
  }

  public async heartbeat(_claim: ClaimedTask): Promise<void> {
    // In-process queue does not track broker-side visibility; the runner
    // core's dataset-driven sweep is the only timeout authority.
  }

  public async acquireIdempotencyLease(input: IdempotencyLeaseInput): Promise<string> {
    const key = `${input.type}:${input.key}`
    const now = Date.now()
    const existing = this.#idempotencyLeases.get(key)
    if (existing && existing.expiresAt > now) return existing.taskId
    this.#idempotencyLeases.set(key, { taskId: input.taskId, expiresAt: now + this.#idempotencyTtlSec * 1000 })
    return input.taskId
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    if (this.#notBeforeTimer) {
      clearTimeout(this.#notBeforeTimer)
      this.#notBeforeTimer = undefined
    }
    for (const ac of this.#subscriptionAborts.values()) ac.abort()
    this.#subscriptionAborts.clear()
    this.#subscriptions.clear()
    this.#queues.clear()
    this.#idempotencyLeases.clear()
    this.#liveByType.clear()
    this.#wake()
  }

  // ── Slot loop ─────────────────────────────────────────────────────

  async #runSlot(subscription: WorkerSubscription, signal: AbortSignal): Promise<void> {
    while (!signal.aborted && !this.#disposed) {
      if (subscription.shouldDrain()) return
      const ready = this.#takeReady(subscription)
      if (!ready) {
        await this.#waitForChange(signal)
        continue
      }

      const claim: ClaimedTask = {
        taskId: ready.taskId,
        type: ready.type,
        receipt: ready,
      }

      let outcome: ClaimOutcome
      try {
        outcome = await subscription.onClaim(claim)
      } catch {
        // Adapter contract: onClaim must not throw. If it does, treat as
        // a requeue without delay so the task is not silently dropped.
        outcome = { kind: 'requeue' }
      } finally {
        // Release the cap slot taken in `#takeReady` regardless of outcome
        // (including `suspended`, so a deep DAG cannot deadlock its lane).
        this.#releaseCap(ready.type)
      }

      if (outcome.kind === 'requeue') {
        const requeued: PendingEntry = {
          taskId: ready.taskId,
          type: ready.type,
          handlerVersion: ready.handlerVersion,
          notBefore: outcome.notBefore?.getTime(),
          tags: ready.tags,
        }
        let q = this.#queues.get(ready.type)
        if (!q) {
          q = []
          this.#queues.set(ready.type, q)
        }
        q.push(requeued)
        this.#scheduleNotBeforeWake()
      }
      // Nudge sibling slots: a freed cap slot or a requeued entry may now
      // be claimable by a slot parked in `#waitForChange`.
      this.#wake()
    }
  }

  #takeReady(subscription: WorkerSubscription): PendingEntry | undefined {
    const now = Date.now()
    for (const type of subscription.types) {
      const q = this.#queues.get(type)
      if (!q || q.length === 0) continue

      const limit = this.#concurrencyLimits[type]
      if (limit !== undefined && (this.#liveByType.get(type) ?? 0) >= limit) continue

      const idx = q.findIndex((entry) => {
        if (entry.notBefore !== undefined && entry.notBefore > now) return false
        const versions = subscription.compatibleVersions[type]
        if (versions && versions.length > 0 && !versions.includes(entry.handlerVersion)) return false
        if (!workerSatisfiesTags(subscription.tags, entry.tags)) return false
        return true
      })
      if (idx === -1) continue

      const taken = q[idx]
      q.splice(idx, 1)
      if (q.length === 0) this.#queues.delete(type)
      if (limit !== undefined) this.#liveByType.set(type, (this.#liveByType.get(type) ?? 0) + 1)
      return taken
    }
    return undefined
  }

  #releaseCap(type: string): void {
    if (this.#concurrencyLimits[type] === undefined) return
    const next = (this.#liveByType.get(type) ?? 0) - 1
    if (next <= 0) this.#liveByType.delete(type)
    else this.#liveByType.set(type, next)
  }

  async #waitForChange(signal: AbortSignal): Promise<void> {
    if (signal.aborted || this.#disposed) return
    await new Promise<void>((resolve) => {
      const wake = (): void => {
        signal.removeEventListener('abort', onAbort)
        this.#waiters.delete(wake)
        resolve()
      }
      const onAbort = (): void => {
        this.#waiters.delete(wake)
        resolve()
      }
      signal.addEventListener('abort', onAbort, { once: true })
      this.#waiters.add(wake)
    })
  }

  // Wake every parked slot — each re-checks `#takeReady` and re-parks if it
  // finds nothing. Waking all (not one) is what lets a worker's `concurrency`
  // slots actually run in parallel; the fleet cap remains the only gate.
  #wake(): void {
    if (this.#waiters.size === 0) return
    const waiters = [...this.#waiters]
    this.#waiters.clear()
    for (const wake of waiters) wake()
  }

  #scheduleNotBeforeWake(): void {
    if (this.#disposed) return
    const now = Date.now()
    let earliest: number | undefined
    for (const q of this.#queues.values()) {
      for (const entry of q) {
        if (entry.notBefore === undefined || entry.notBefore <= now) continue
        if (earliest === undefined || entry.notBefore < earliest) earliest = entry.notBefore
      }
    }
    if (this.#notBeforeTimer) clearTimeout(this.#notBeforeTimer)
    if (earliest === undefined) {
      this.#notBeforeTimer = undefined
      return
    }
    this.#notBeforeTimer = setTimeout(() => {
      this.#notBeforeTimer = undefined
      this.#wake()
      // Re-arm for the next-earliest delayed entry. Without this, a batch of
      // staggered `notBefore` tasks strands every entry after the first timer
      // fires, since nothing else re-runs the scheduler until a new enqueue.
      this.#scheduleNotBeforeWake()
    }, earliest - now)
  }
}
