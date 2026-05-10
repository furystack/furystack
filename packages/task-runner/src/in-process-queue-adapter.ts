import type {
  ClaimedTask,
  ClaimOutcome,
  EnqueueInput,
  IdempotencyLeaseInput,
  QueueAdapter,
  QueueAdapterCapabilities,
  WorkerSubscription,
} from './queue-adapter.js'

type PendingEntry = {
  taskId: string
  type: string
  handlerVersion: number
  notBefore?: number
}

const CAPABILITIES: QueueAdapterCapabilities = Object.freeze({
  persistent: false,
  distributed: false,
  delayedDispatch: true,
  fleetCapEnforcement: false,
  brokerSideReclaim: false,
})

/**
 * In-process implementation of {@link QueueAdapter}. Holds per-type
 * FIFO queues in memory and serves concurrent claim slots via a single
 * `Promise`-based wakeup. No persistence — tasks lost on restart are
 * recovered through the runner core's dataset-based reconciler (PRD §7.4).
 */
export class InProcessQueueAdapter implements QueueAdapter {
  public readonly capabilities: QueueAdapterCapabilities = CAPABILITIES

  readonly #queues = new Map<string, PendingEntry[]>()
  readonly #subscriptions = new Set<WorkerSubscription>()
  readonly #subscriptionAborts = new Map<WorkerSubscription, AbortController>()
  readonly #idempotencyLeases = new Map<string, string>()

  #wakeup: (() => void) | undefined
  #notBeforeTimer: ReturnType<typeof setTimeout> | undefined
  #disposed = false

  // ── Public API ────────────────────────────────────────────────────

  public async enqueue(input: EnqueueInput): Promise<void> {
    if (this.#disposed) return
    const entry: PendingEntry = {
      taskId: input.taskId,
      type: input.type,
      handlerVersion: input.handlerVersion,
      notBefore: input.notBefore?.getTime(),
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
    const existing = this.#idempotencyLeases.get(key)
    if (existing !== undefined) return existing
    this.#idempotencyLeases.set(key, input.taskId)
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
      }

      if (outcome.kind === 'requeue') {
        const requeued: PendingEntry = {
          taskId: ready.taskId,
          type: ready.type,
          handlerVersion: ready.handlerVersion,
          notBefore: outcome.notBefore?.getTime(),
        }
        let q = this.#queues.get(ready.type)
        if (!q) {
          q = []
          this.#queues.set(ready.type, q)
        }
        q.push(requeued)
        this.#wake()
        this.#scheduleNotBeforeWake()
      }
    }
  }

  #takeReady(subscription: WorkerSubscription): PendingEntry | undefined {
    const now = Date.now()
    for (const type of subscription.types) {
      const q = this.#queues.get(type)
      if (!q || q.length === 0) continue
      const idx = q.findIndex((entry) => {
        if (entry.notBefore !== undefined && entry.notBefore > now) return false
        const versions = subscription.compatibleVersions[type]
        if (versions && versions.length > 0 && !versions.includes(entry.handlerVersion)) return false
        return true
      })
      if (idx === -1) continue
      const taken = q[idx]
      q.splice(idx, 1)
      if (q.length === 0) this.#queues.delete(type)
      return taken
    }
    return undefined
  }

  async #waitForChange(signal: AbortSignal): Promise<void> {
    if (signal.aborted || this.#disposed) return
    await new Promise<void>((resolve) => {
      const onAbort = (): void => {
        signal.removeEventListener('abort', onAbort)
        resolve()
      }
      signal.addEventListener('abort', onAbort, { once: true })
      this.#wakeup = () => {
        signal.removeEventListener('abort', onAbort)
        resolve()
      }
    })
    this.#wakeup = undefined
  }

  #wake(): void {
    const w = this.#wakeup
    this.#wakeup = undefined
    if (w) w()
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
    }, earliest - now)
  }
}
