import type {
  ClaimedTask,
  ClaimOutcome,
  EnqueueInput,
  IdempotencyLeaseInput,
  QueueAdapter,
  QueueAdapterCapabilities,
  WorkerSubscription,
} from '@furystack/task-runner'
import type { createClient } from 'redis'

type RedisLikeClient = ReturnType<typeof createClient>

/**
 * Options accepted by {@link RedisQueueAdapter}.
 */
export type RedisQueueAdapterOptions = {
  /**
   * Caller-owned `redis` client. Must be connected before the adapter
   * is used. The adapter never closes it — lifecycle stays with the
   * application, mirroring `@furystack/redis-cross-node-bus` and
   * `@furystack/s3-blob-store`.
   */
  client: RedisLikeClient
  /**
   * Logical service name. Used in telemetry attribution and (when
   * `topicPrefix` is left default) helps debug shared brokers.
   */
  serviceName: string
  /**
   * Wire-level prefix applied to every stream key. Multi-service
   * deployments pick a distinct prefix per service.
   */
  topicPrefix?: string
  /**
   * Stable consumer group name. All workers join this group; PRD §7.4
   * relies on consumer-group competing-consumer semantics for fan-out.
   * Default: `runner`.
   */
  consumerGroup?: string
  /**
   * Default visibility timeout (milliseconds). A handler attempt is
   * considered stale when its PEL idle time exceeds this; XAUTOCLAIM
   * reclaims it for another consumer. Apps can override per task type
   * via {@link RedisQueueAdapterOptions.visibilityTimeoutByType}.
   * Default: `60_000`.
   */
  visibilityTimeoutMs?: number
  /**
   * Per-task-type visibility-timeout override map. Useful when one
   * type does GPU-bound work and another short polls.
   */
  visibilityTimeoutByType?: Record<string, number>
  /**
   * `XREADGROUP BLOCK` timeout (milliseconds). Lower values reduce
   * wakeup latency on shutdown; higher values reduce broker chatter.
   * Default: `200`.
   */
  blockTimeoutMs?: number
  /**
   * Backoff between `XREADGROUP` attempts after a transport error so
   * a disconnected broker does not produce a tight reconnect spin.
   * Default: `250`.
   */
  retryBackoffMs?: number
  /**
   * Idempotency-lease TTL (seconds) for
   * {@link RedisQueueAdapter.acquireIdempotencyLease}. Default: 24h.
   */
  idempotencyTtlSec?: number
  /**
   * Delayed-dispatch tick interval (milliseconds). Each tick atomically
   * pops due entries from the scheduler ZSET and `XADD`s them onto the
   * matching `(type, version)` stream. Lower values = lower delay
   * jitter at the cost of broker chatter; higher values = looser
   * floor on `notBefore` granularity. Default: `250`.
   */
  schedulerIntervalMs?: number
}

const CAPABILITIES: QueueAdapterCapabilities = Object.freeze({
  persistent: true,
  distributed: true,
  delayedDispatch: true,
  fleetCapEnforcement: false,
  brokerSideReclaim: true,
})

const DEFAULT_GROUP = 'runner'
const DEFAULT_VISIBILITY_MS = 60_000
const DEFAULT_BLOCK_MS = 200
const DEFAULT_RETRY_BACKOFF_MS = 250
const DEFAULT_IDEMPOTENCY_TTL_SEC = 86_400
const DEFAULT_SCHEDULER_INTERVAL_MS = 250
const SCHEDULER_BATCH_LIMIT = 64

/**
 * Atomically: pop ZSET members whose score ≤ now, parse their JSON
 * envelope, XADD the resulting message to the per-`(type, version)`
 * stream, and ZREM the member. Single round-trip prevents two adapter
 * instances from double-dispatching the same delayed task.
 *
 * `KEYS[1]` — scheduler ZSET key.
 * `ARGV[1]` — current epoch ms (caller-supplied so the script's own
 * server-clock drift cannot diverge from the runner's notion of `now`).
 * `ARGV[2]` — batch limit.
 * `ARGV[3]` — `topicPrefix` used to build the destination stream key.
 *
 * Returns the number of dispatched entries.
 */
const SCHEDULER_DISPATCH_SCRIPT = `
local now = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local prefix = ARGV[3]
local sched = KEYS[1]

local members = redis.call('ZRANGEBYSCORE', sched, '-inf', now, 'LIMIT', 0, limit)
local dispatched = 0
for _, member in ipairs(members) do
  local removed = redis.call('ZREM', sched, member)
  if removed == 1 then
    local meta = cjson.decode(member)
    local stream = prefix .. 'tasks:queue:' .. meta.type .. ':v' .. tostring(meta.handlerVersion)
    redis.call('XADD', stream, '*',
      'taskId', meta.taskId,
      'type', meta.type,
      'handlerVersion', tostring(meta.handlerVersion))
    dispatched = dispatched + 1
  end
end
return dispatched
`

type RedisReceipt = {
  stream: string
  msgId: string
  consumer: string
  deliveryCount: number
}

type StreamMessageEntry = { id: string; message: Record<string, string> }

type XReadGroupReply = Array<{
  name: string
  messages: StreamMessageEntry[]
}>

type XAutoClaimReply = {
  nextId: string
  messages: Array<StreamMessageEntry | null>
}

type SubscriptionState = {
  subscription: WorkerSubscription
  consumers: string[]
  streams: string[]
  abortController: AbortController
  slotPromises: Array<Promise<void>>
}

/**
 * Redis Streams implementation of {@link QueueAdapter}. Each
 * `(type, handlerVersion)` lane gets its own stream
 * (`${topicPrefix}tasks:queue:${type}:v${handlerVersion}`); workers
 * register against the streams whose `(type, version)` they support
 * via the {@link WorkerSubscription.compatibleVersions} map.
 *
 * **Concurrency.** Each subscription spawns
 * {@link WorkerSubscription.concurrency} parallel claim slots. A slot
 * is one consumer in the consumer group named
 * `${workerId}-slot-${index}`; messages handed to a slot live in that
 * consumer's PEL until ack. Multiple slots share the same group, so
 * Redis itself enforces competing-consumer semantics.
 *
 * **Visibility reclaim.** Every slot iteration runs `XAUTOCLAIM` first
 * (idle threshold = the type's `visibilityTimeoutMs`); reclaimed
 * entries are delivered through the same `onClaim` path as fresh
 * messages, with an attempt re-classification done by the runner core
 * (the dataset still records the prior attempt as `'timed-out'`).
 *
 * **Heartbeat.** {@link RedisQueueAdapter.heartbeat} resets the PEL
 * idle counter via `XCLAIM JUSTID` so long-running handlers don't get
 * reclaimed.
 *
 * Single-PUT only — see PRD §7.6 / §16 Q7. Delayed dispatch is not
 * implemented in this revision; setting `notBefore` against this
 * adapter is rejected at the runner-core boundary (capability flag).
 */
export class RedisQueueAdapter implements QueueAdapter {
  public readonly capabilities: QueueAdapterCapabilities = CAPABILITIES

  readonly #client: RedisLikeClient
  readonly #topicPrefix: string
  readonly #group: string
  readonly #defaultVisibilityMs: number
  readonly #visibilityByType: Record<string, number>
  readonly #blockMs: number
  readonly #retryBackoffMs: number
  readonly #idempotencyTtlSec: number
  readonly #schedulerIntervalMs: number

  readonly #subscriptions = new Set<SubscriptionState>()
  readonly #ensuredGroups = new Set<string>()

  readonly #schedulerTimer: ReturnType<typeof setInterval>
  #schedulerRunning = false
  #disposed = false

  constructor(options: RedisQueueAdapterOptions) {
    if (!options.serviceName || options.serviceName.length === 0) {
      throw new Error('RedisQueueAdapter: `serviceName` is required')
    }
    this.#client = options.client
    this.#topicPrefix = options.topicPrefix ?? ''
    this.#group = options.consumerGroup ?? DEFAULT_GROUP
    this.#defaultVisibilityMs = options.visibilityTimeoutMs ?? DEFAULT_VISIBILITY_MS
    this.#visibilityByType = options.visibilityTimeoutByType ?? {}
    this.#blockMs = options.blockTimeoutMs ?? DEFAULT_BLOCK_MS
    this.#retryBackoffMs = options.retryBackoffMs ?? DEFAULT_RETRY_BACKOFF_MS
    this.#idempotencyTtlSec = options.idempotencyTtlSec ?? DEFAULT_IDEMPOTENCY_TTL_SEC
    this.#schedulerIntervalMs = options.schedulerIntervalMs ?? DEFAULT_SCHEDULER_INTERVAL_MS

    // `unref()` so an idle scheduler timer never holds the process
    // open in single-shot scripts / tests.
    this.#schedulerTimer = setInterval(() => void this.#runSchedulerTick(), this.#schedulerIntervalMs)
    this.#schedulerTimer.unref?.()
  }

  // ── Public API ────────────────────────────────────────────────────

  public async enqueue(input: EnqueueInput): Promise<void> {
    this.#ensureLive()
    const stream = this.#streamKey(input.type, input.handlerVersion)
    // Ensure the consumer group exists eagerly — workers subscribing
    // later will pick up XADDs that happen between scheduler dispatch
    // and the worker's group-create call only when the group already
    // claims the stream's history.
    await this.#ensureGroup(stream)

    const dueAt = input.notBefore?.getTime()
    if (dueAt !== undefined && dueAt > Date.now()) {
      const member = JSON.stringify({
        taskId: input.taskId,
        type: input.type,
        handlerVersion: input.handlerVersion,
      })
      await this.#client.zAdd(this.#schedulerKey(), { score: dueAt, value: member })
      return
    }

    await this.#client.xAdd(stream, '*', {
      taskId: input.taskId,
      type: input.type,
      handlerVersion: String(input.handlerVersion),
    })
  }

  public subscribe(subscription: WorkerSubscription): Disposable {
    this.#ensureLive()

    const streams = this.#streamsFor(subscription)
    const ac = new AbortController()
    const consumers: string[] = []
    const slotPromises: Array<Promise<void>> = []

    const state: SubscriptionState = {
      subscription,
      consumers,
      streams,
      abortController: ac,
      slotPromises,
    }
    this.#subscriptions.add(state)

    void (async () => {
      for (const stream of streams) {
        await this.#ensureGroup(stream)
      }
      for (let i = 0; i < subscription.concurrency; i++) {
        const consumerName = `${subscription.workerId}-slot-${i}`
        consumers.push(consumerName)
        slotPromises.push(this.#runSlot(state, consumerName, ac.signal))
      }
    })().catch(() => {
      // Setup failure leaves the subscription empty; disposal is still
      // safe, and the caller will see no claims arrive — surfaceable
      // via telemetry once the runner core wires it through.
    })

    return {
      [Symbol.dispose]: () => {
        ac.abort()
        this.#subscriptions.delete(state)
      },
    }
  }

  public async heartbeat(claim: ClaimedTask): Promise<void> {
    if (this.#disposed) return
    const receipt = claim.receipt as RedisReceipt
    try {
      await this.#client.xClaimJustId(receipt.stream, this.#group, receipt.consumer, 0, [receipt.msgId])
    } catch {
      // Heartbeat is best-effort. A transient broker error means the
      // PEL idle counter keeps ticking; XAUTOCLAIM will reclaim the
      // attempt if the issue persists past the visibility timeout.
    }
  }

  public async acquireIdempotencyLease(input: IdempotencyLeaseInput): Promise<string> {
    this.#ensureLive()
    const key = this.#idempotencyKey(input.type, input.key)
    const set = await this.#client.set(key, input.taskId, {
      NX: true,
      EX: this.#idempotencyTtlSec,
    })
    if (set === 'OK') return input.taskId

    const existing = await this.#client.get(key)
    return typeof existing === 'string' && existing.length > 0 ? existing : input.taskId
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    clearInterval(this.#schedulerTimer)
    for (const state of this.#subscriptions) {
      state.abortController.abort()
    }
    this.#subscriptions.clear()
  }

  // ── Internal helpers ──────────────────────────────────────────────

  #streamKey(type: string, version: number): string {
    return `${this.#topicPrefix}tasks:queue:${type}:v${version}`
  }

  #idempotencyKey(type: string, key: string): string {
    return `${this.#topicPrefix}tasks:idem:${type}:${key}`
  }

  #schedulerKey(): string {
    return `${this.#topicPrefix}tasks:scheduler`
  }

  /**
   * Drains due delayed entries from the scheduler ZSET. Re-entrant
   * guard prevents overlapping ticks on slow brokers; errors are
   * swallowed so a transient `EVAL` failure does not poison the
   * timer. The Lua script is the only authority for race-free
   * dispatch — see {@link SCHEDULER_DISPATCH_SCRIPT}.
   */
  async #runSchedulerTick(): Promise<void> {
    if (this.#disposed || this.#schedulerRunning) return
    this.#schedulerRunning = true
    try {
      // The `redis` v5 client exposes `eval` with `keys` / `arguments`
      // option fields; the cast keeps `RedisLikeClient` opaque.
      const evalFn = this.#client.eval as (
        script: string,
        opts: { keys: string[]; arguments: string[] },
      ) => Promise<unknown>
      await evalFn.call(this.#client, SCHEDULER_DISPATCH_SCRIPT, {
        keys: [this.#schedulerKey()],
        arguments: [String(Date.now()), String(SCHEDULER_BATCH_LIMIT), this.#topicPrefix],
      })
    } catch {
      // Best-effort: a transient broker failure means due entries stay
      // in the ZSET and the next tick retries.
    } finally {
      this.#schedulerRunning = false
    }
  }

  #streamsFor(subscription: WorkerSubscription): string[] {
    const streams = new Set<string>()
    for (const type of subscription.types) {
      const versions = subscription.compatibleVersions[type]
      const expanded = versions && versions.length > 0 ? Array.from(versions) : [1]
      for (const version of expanded) {
        streams.add(this.#streamKey(type, version))
      }
    }
    return Array.from(streams)
  }

  #visibilityFor(type: string): number {
    const override = this.#visibilityByType[type]
    return typeof override === 'number' ? override : this.#defaultVisibilityMs
  }

  async #ensureGroup(stream: string): Promise<void> {
    if (this.#ensuredGroups.has(stream)) return
    try {
      await this.#client.xGroupCreate(stream, this.#group, '$', { MKSTREAM: true })
    } catch (error) {
      // BUSYGROUP = group already exists (idempotent setup).
      if (!isBusyGroupError(error)) throw error
    }
    this.#ensuredGroups.add(stream)
  }

  async #runSlot(state: SubscriptionState, consumerName: string, signal: AbortSignal): Promise<void> {
    const { subscription, streams } = state

    while (!signal.aborted && !this.#disposed) {
      if (subscription.shouldDrain()) return

      // 1. Try to reclaim any stale PEL entries (broker-side reclaim).
      const reclaimed = await this.#tryReclaim(streams, consumerName, signal)
      if (reclaimed) {
        await this.#deliver(state, reclaimed.stream, reclaimed.entry, consumerName)
        continue
      }

      if (signal.aborted || this.#disposed) return
      if (subscription.shouldDrain()) return

      // 2. Read fresh entries.
      const fresh = await this.#tryRead(streams, consumerName)
      if (!fresh) {
        // Broker error — short backoff to avoid spin.
        await sleep(this.#retryBackoffMs, signal)
        continue
      }
      if (fresh.entry) {
        await this.#deliver(state, fresh.stream, fresh.entry, consumerName)
      }
    }
  }

  async #tryReclaim(
    streams: string[],
    consumerName: string,
    signal: AbortSignal,
  ): Promise<{ stream: string; entry: StreamMessageEntry } | undefined> {
    for (const stream of streams) {
      if (signal.aborted || this.#disposed) return undefined
      const minIdle = this.#visibilityForStream(stream)
      let reply: XAutoClaimReply | undefined
      try {
        reply = await this.#client.xAutoClaim(stream, this.#group, consumerName, minIdle, '0', {
          COUNT: 1,
        })
      } catch {
        return undefined
      }
      const entry = pickFirstEntry(reply?.messages)
      if (entry) return { stream, entry }
    }
    return undefined
  }

  async #tryRead(
    streams: string[],
    consumerName: string,
  ): Promise<{ stream: string; entry: StreamMessageEntry | undefined } | undefined> {
    let reply: XReadGroupReply | null
    try {
      reply = (await this.#client.xReadGroup(
        this.#group,
        consumerName,
        streams.map((key) => ({ key, id: '>' })),
        { BLOCK: this.#blockMs, COUNT: 1 },
      )) as unknown as XReadGroupReply | null
    } catch {
      return undefined
    }
    if (!reply || reply.length === 0) return { stream: streams[0] ?? '', entry: undefined }
    const first = reply[0]
    if (!first) return { stream: streams[0] ?? '', entry: undefined }
    const entry = first.messages[0]
    return { stream: first.name, entry }
  }

  async #deliver(
    state: SubscriptionState,
    stream: string,
    entry: StreamMessageEntry,
    consumerName: string,
  ): Promise<void> {
    const { taskId } = entry.message
    const { type } = entry.message
    if (typeof taskId !== 'string' || typeof type !== 'string') {
      // Malformed entry — drop it. Without a taskId we can't route it,
      // so leaving it in the PEL would block the consumer forever.
      try {
        await this.#client.xAck(stream, this.#group, entry.id)
      } catch {
        // Swallow — the autoclaim loop will retry on the next cycle.
      }
      return
    }

    const claim: ClaimedTask = {
      taskId,
      type,
      receipt: {
        stream,
        msgId: entry.id,
        consumer: consumerName,
        deliveryCount: 0,
      } satisfies RedisReceipt,
    }

    let outcome: ClaimOutcome
    try {
      outcome = await state.subscription.onClaim(claim)
    } catch {
      outcome = { kind: 'requeue' }
    }

    try {
      if (outcome.kind === 'requeue') {
        await this.#client.xAck(stream, this.#group, entry.id)
        await this.#client.xAdd(stream, '*', entry.message)
      } else {
        await this.#client.xAck(stream, this.#group, entry.id)
      }
    } catch {
      // Ack failure leaves the entry in PEL; the next XAUTOCLAIM cycle
      // will surface it for re-delivery once the visibility timeout
      // expires. Better than silently leaking the message.
    }
  }

  #visibilityForStream(stream: string): number {
    // Stream key shape: `${prefix}tasks:queue:${type}:v${version}`.
    // Slice to recover the type for per-type override lookup.
    const marker = 'tasks:queue:'
    const idx = stream.indexOf(marker)
    if (idx === -1) return this.#defaultVisibilityMs
    const tail = stream.slice(idx + marker.length)
    const versionIdx = tail.lastIndexOf(':v')
    const type = versionIdx === -1 ? tail : tail.slice(0, versionIdx)
    return this.#visibilityFor(type)
  }

  #ensureLive(): void {
    if (this.#disposed) {
      throw new Error('RedisQueueAdapter has been disposed')
    }
  }
}

const isBusyGroupError = (error: unknown): boolean => error instanceof Error && /BUSYGROUP/i.test(error.message)

const pickFirstEntry = (messages: Array<StreamMessageEntry | null> | undefined): StreamMessageEntry | undefined => {
  if (!messages) return undefined
  for (const entry of messages) {
    if (entry) return entry
  }
  return undefined
}

const sleep = (ms: number, signal: AbortSignal): Promise<void> =>
  new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = (): void => {
      clearTimeout(timer)
      resolve()
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
