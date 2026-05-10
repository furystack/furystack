/**
 * Capabilities a {@link QueueAdapter} declares statically. Used by the
 * boot-time capability cross-check (PRD §9) and to gate optional features
 * (delayed dispatch, fleet caps) at submit time.
 */
export type QueueAdapterCapabilities = {
  /** Queue survives broker restart. In-process: false; Redis: true. */
  readonly persistent: boolean
  /** Queue can dispatch work across processes. In-process: false; Redis: true. */
  readonly distributed: boolean
  /** {@link EnqueueInput.notBefore} is honored at the broker level. */
  readonly delayedDispatch: boolean
  /** Atomic fleet-wide concurrency caps (Redis Lua INCR/DECR). */
  readonly fleetCapEnforcement: boolean
  /**
   * Adapter performs its own stale-claim recovery (e.g. Redis
   * `XAUTOCLAIM`). When `true`, the runner core's dataset-based
   * visibility sweep is skipped — the adapter is responsible for
   * re-yielding stale claims through the subscription's `onClaim` hook.
   */
  readonly brokerSideReclaim: boolean
}

/**
 * Payload pushed to the queue when a task transitions to `'pending'`.
 * The adapter persists or buffers the entry until a matching subscriber
 * picks it up via {@link QueueAdapter.subscribe}.
 */
export type EnqueueInput = {
  taskId: string
  type: string
  /** Submitted handler version; adapters with version-shard publishing
   *  use it to route to the correct shard. */
  handlerVersion: number
  /** Earliest dispatch time. Adapters without
   *  {@link QueueAdapterCapabilities.delayedDispatch} ignore this and
   *  the runner core throws at submit time when set against an
   *  incapable adapter. */
  notBefore?: Date
}

/**
 * One unit of work yielded to the runner core via
 * {@link WorkerSubscription.onClaim}. The `receipt` is opaque — adapters
 * thread their own per-claim state through it (in-process: a queue
 * pointer; Redis: `{ stream, msgId, consumer }`).
 */
export type ClaimedTask = {
  readonly taskId: string
  readonly type: string
  readonly receipt: unknown
}

/**
 * Outcome the runner returns from {@link WorkerSubscription.onClaim}.
 * The adapter ack/requeue/discards based on the discriminator.
 *
 * - `success` / `failed` / `cancelled` — terminal from the queue's
 *   perspective; adapter acks and forgets.
 * - `suspended` — handler hit `awaitChildren`; queue acks (the parent
 *   is re-enqueued by the runner core when children terminate).
 * - `requeue` — release back to the queue without finalizing; used for
 *   tag/version mismatches and retry-after-failure paths.
 */
export type ClaimOutcome =
  | { readonly kind: 'success' }
  | { readonly kind: 'failed' }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'suspended' }
  | { readonly kind: 'requeue'; readonly notBefore?: Date }

/**
 * Worker registration the runner core hands to the adapter via
 * {@link QueueAdapter.subscribe}. The adapter spawns `concurrency`
 * concurrent claim slots, each invoking `onClaim` for one task at a
 * time and awaiting the returned outcome before pulling another.
 */
export type WorkerSubscription = {
  readonly workerId: string
  readonly concurrency: number
  /** Task types this worker can handle. Adapter only yields claims
   *  whose `type` is in this list. */
  readonly types: readonly string[]
  /**
   * Type → list of accepted handler versions. Empty array or missing
   *  key means "any version" (claim-then-filter mode). Adapters that
   *  shard by version at publish time (Redis) use this to subscribe
   *  only to compatible shards.
   */
  readonly compatibleVersions: Readonly<Record<string, readonly number[]>>
  /** Returns true when the worker has signalled drain — adapter must
   *  stop pulling new claims while existing ones finish. */
  shouldDrain(): boolean
  /** Adapter-side hook called once per claim. The returned Promise's
   *  resolution drives the ack/requeue decision. */
  onClaim(claim: ClaimedTask): Promise<ClaimOutcome>
}

/**
 * Optional input shape for {@link QueueAdapter.acquireIdempotencyLease}.
 * The adapter atomically (cross-node) decides whether `taskId` is the
 * winner for `(type, key)` and returns the winning id — callers compare
 * against their proposed id to detect that someone else won the race.
 */
export type IdempotencyLeaseInput = {
  type: string
  key: string
  taskId: string
}

/**
 * Transport-agnostic queue contract for the task runner. Implementations
 * own claim/ack/heartbeat plumbing; the runner core owns task lifecycle,
 * replay, retry, cancellation cascade, and telemetry.
 *
 * Bind a concrete implementation by composing it inside a
 * `defineXxxTaskRunner` factory; apps never resolve this contract
 * directly.
 */
export type QueueAdapter = Disposable & {
  readonly capabilities: QueueAdapterCapabilities

  /**
   * Push a task onto the queue. Called by the runner core when a task
   * transitions to `'pending'` (via `submit`, `start`, retry, parent
   * wake, or `spawnChild`).
   */
  enqueue(input: EnqueueInput): Promise<void>

  /**
   * Register a worker. Adapter spawns `subscription.concurrency`
   * concurrent claim slots and yields each picked task to
   * `subscription.onClaim`. The returned `Disposable` cancels the
   * worker's claim loops; in-flight claims finish naturally and the
   * adapter awaits their outcome before disposing the underlying
   * resources.
   */
  subscribe(subscription: WorkerSubscription): Disposable

  /**
   * Refresh broker-side visibility for an in-flight claim. Called by
   * the runner core periodically (and implicitly via
   * `ctx.reportProgress`). In-process adapter: no-op. Redis adapter:
   * `XCLAIM <stream> <group> <consumer> 0 <msgId> JUSTID`.
   */
  heartbeat(claim: ClaimedTask): Promise<void>

  /**
   * Optional cross-node atomic idempotency lease. The runner core
   * calls this before persisting a new task whose `idempotencyKey` is
   * set: if the returned id ≠ `input.taskId`, another submit already
   * won and the existing task should be returned instead. Adapters
   * without this hook fall back to dataset-scan + per-process map,
   * which is single-process safe but races across nodes.
   */
  acquireIdempotencyLease?(input: IdempotencyLeaseInput): Promise<string>
}
