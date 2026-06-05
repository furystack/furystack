import { randomUUID } from 'node:crypto'
import type { BlobStore } from '@furystack/blob-store'
import type { BusMessage, CrossNodeBus } from '@furystack/cross-node-bus'
import type { Injector } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import type { AnyTaskHandlerDescriptor } from './define-task-handler.js'
import { isSuspendedError } from './suspended-error.js'
import { calculateBackoff } from './retry-policy.js'
import type { ClaimedTask, ClaimOutcome, QueueAdapter, WorkerSubscription } from './queue-adapter.js'
import { workerSatisfiesTags } from './queue-adapter.js'
import type {
  RegisterWorkerOptions,
  StartOptions,
  SubmitOptions,
  TaskRunner,
  TaskRunnerCapabilities,
  Worker,
} from './task-runner.js'
import { Task, DEFAULT_RETENTION_POLICY, MAX_EVENTS_PER_TASK } from './types.js'
import type { AttemptRecord, TaskEvent, TaskReplayLogEntry, TaskTreeNode, TaskUpdate } from './types.js'
import type { TaskRunnerTelemetry } from './task-runner-telemetry.js'
import { buildReplayIndex, buildTaskContext, type TaskContextFactoryDeps } from './task-context-factory.js'
import { estimateSize, toErrorInfo, waitMs, type CancelBroadcastPayload } from './task-runner-internals.js'
import { allChildrenTerminal, buildTree, detectCycle, findByIdempotencyKey } from './task-queries.js'
import { cascadeCancel, reapOrphans, type CancelDeps } from './cancel-cascade.js'
import { reconcile, submitChild, wakeParent } from './dag-continuation.js'
import type { CoreTaskOps } from './task-runner-ops.js'

/** Retry budget for resolving a lost idempotency race before the winning
 *  submit has finished persisting its task. */
const IDEMPOTENCY_FIND_RETRIES = 5
const IDEMPOTENCY_FIND_DELAY_MS = 50

type WorkerRegistration = {
  workerId: string
  name: string
  concurrency: number
  tags: string[]
  compatibleVersions: Record<string, number[]>
  handlers: Map<string, AnyTaskHandlerDescriptor>
  activeTasks: Set<string>
  draining: boolean
  drainResolve?: () => void
  cancelSubscriptions: Disposable[]
  /** Adapter handle returned by `subscribe` — disposed on worker dispose. */
  queueSubscription?: Disposable
}

/** Result of a successful claim transition — everything `#runHandler` needs. */
type ClaimSetup = {
  kind: 'claimed'
  task: Task
  handler: AnyTaskHandlerDescriptor
  ac: AbortController
  attempt: number
  claimTime: string
}

/** Claim transition outcomes that do not run a handler (already-done / wrong-worker). */
type ClaimReject = { kind: 'success' } | { kind: 'requeue' }

/** Timer knobs for the core. Both intervals accept `Infinity` to disable the loop (tests drive manually). */
export type TaskRunnerCoreOptions = {
  /** How often to re-enqueue stuck `waiting` parents whose wake was missed. */
  reconcilerIntervalMs?: number
  /** How often to scan for visibility-lapsed claims to reclaim. */
  sweepIntervalMs?: number
}

/** Collaborators the core resolves up front. Concrete runners assemble this from the injector. */
export type TaskRunnerCoreDeps = {
  injector: Injector
  bus: CrossNodeBus
  blobStore: BlobStore
  taskDs: DataSet<Task, 'id'>
  replayDs: DataSet<TaskReplayLogEntry, 'id'>
  telemetry: TaskRunnerTelemetry
  queueAdapter: QueueAdapter
}

/**
 * Transport-agnostic runner core. Owns task lifecycle, replay, retry,
 * cancellation cascade, parent-wake reconciliation, and telemetry.
 * Queue plumbing is delegated to the supplied {@link QueueAdapter}.
 *
 * Concrete runner classes (`InProcessTaskRunner`, `RedisTaskRunner`)
 * subclass this with a pre-bound adapter so apps can swap transports
 * without changing handler code.
 */
export class TaskRunnerCore implements TaskRunner {
  public readonly capabilities: TaskRunnerCapabilities

  readonly #injector: Injector
  readonly #taskDs: DataSet<Task, 'id'>
  readonly #replayDs: DataSet<TaskReplayLogEntry, 'id'>
  readonly #bus: CrossNodeBus
  readonly #telemetry: TaskRunnerTelemetry
  readonly #queueAdapter: QueueAdapter

  readonly #workers = new Map<string, WorkerRegistration>()
  readonly #taskSubs = new Map<string, Set<(event: TaskUpdate) => void>>()
  readonly #typeSubs = new Map<string, Set<(event: TaskUpdate) => void>>()
  readonly #abortControllers = new Map<string, AbortController>()

  readonly #taskLocks = new Map<string, Promise<void>>()

  readonly #reconcilerTimer: ReturnType<typeof setInterval>
  readonly #sweepTimer: ReturnType<typeof setInterval> | undefined

  readonly #contextDeps: TaskContextFactoryDeps
  readonly #ops: CoreTaskOps
  readonly #cancelDeps: CancelDeps

  #disposed = false

  constructor(deps: TaskRunnerCoreDeps, options?: TaskRunnerCoreOptions) {
    this.#injector = deps.injector
    this.#bus = deps.bus
    this.#taskDs = deps.taskDs
    this.#replayDs = deps.replayDs
    this.#telemetry = deps.telemetry
    this.#queueAdapter = deps.queueAdapter

    this.capabilities = Object.freeze({
      persistent: deps.queueAdapter.capabilities.persistent,
      fleetCapEnforcement: deps.queueAdapter.capabilities.fleetCapEnforcement,
      delayedDispatch: deps.queueAdapter.capabilities.delayedDispatch,
      maxPayloadBytes: Infinity,
    })

    this.#ops = {
      injector: deps.injector,
      taskDs: deps.taskDs,
      queueAdapter: deps.queueAdapter,
      bus: deps.bus,
      telemetry: deps.telemetry,
      abortControllers: this.#abortControllers,
      isDisposed: () => this.#disposed,
      withTaskLock: (taskId, fn) => this.#withTaskLock(taskId, fn),
      pushEvent: (taskId, event) => this.#pushEvent(taskId, event),
      emit: (type, update) => this.#emit(type, update),
    }
    this.#cancelDeps = { ...this.#ops, wakeParent: (childTaskId) => wakeParent(this.#ops, childTaskId) }

    this.#contextDeps = {
      injector: deps.injector,
      blobStore: deps.blobStore,
      taskDs: deps.taskDs,
      telemetry: deps.telemetry,
      emit: (type, update) => this.#emit(type, update),
      persistReplayEntry: (entry) => this.#persistReplayEntry(entry),
      submitChild: (parentId, parentType, childId, childType, childPayload, retention, tags) =>
        submitChild(this.#ops, parentId, parentType, childId, childType, childPayload, retention, tags),
      allChildrenTerminal: (ids) => allChildrenTerminal(this.#taskDs, this.#injector, ids),
      withTaskLock: (taskId, fn) => this.#withTaskLock(taskId, fn),
    }

    this.#reconcilerTimer = setInterval(() => void reconcile(this.#ops), options?.reconcilerIntervalMs ?? 30_000)
    this.#sweepTimer = deps.queueAdapter.capabilities.brokerSideReclaim
      ? undefined
      : setInterval(() => void this.#sweepVisibility(), options?.sweepIntervalMs ?? 1_000)
  }

  // ── Public API ────────────────────────────────────────────────────

  public async submit<TPayload = unknown>(args: SubmitOptions<TPayload>): Promise<Task> {
    this.#ensureLive()
    this.#validateNotBefore(args)

    let reservedId: string | undefined
    if (args.idempotencyKey) {
      const { existing, reservedId: reserved } = await this.#resolveIdempotency(args.type, args.idempotencyKey)
      if (existing) return existing
      reservedId = reserved
    }

    const persisted = await this.#persistInitialTask(args, 'pending', reservedId)
    this.#telemetry.emit('onTaskSubmitted', {
      taskId: persisted.id,
      type: persisted.type,
      parentTaskId: persisted.parentTaskId,
      payloadBytes: estimateSize(persisted.payload),
    })
    await this.#queueAdapter.enqueue({
      taskId: persisted.id,
      type: persisted.type,
      handlerVersion: persisted.handlerVersion,
      notBefore: persisted.notBefore ? new Date(persisted.notBefore) : undefined,
      tags: persisted.tags,
    })
    return persisted
  }

  public async draft<TPayload = unknown>(args: SubmitOptions<TPayload>): Promise<Task> {
    this.#ensureLive()

    let reservedId: string | undefined
    if (args.idempotencyKey) {
      const { existing, reservedId: reserved } = await this.#resolveIdempotency(args.type, args.idempotencyKey)
      if (existing) return existing
      reservedId = reserved
    }

    return this.#persistInitialTask(args, 'draft', reservedId)
  }

  public async start<TPayload = unknown>(taskId: string, opts?: StartOptions<TPayload>): Promise<Task> {
    this.#ensureLive()

    const released = await this.#withTaskLock(taskId, async () => {
      const task = await this.#taskDs.get(this.#injector, taskId)
      if (!task) throw new Error(`Task ${taskId} not found`)
      if (task.status !== 'draft') {
        throw new Error(`Task ${taskId} cannot be started: status is '${task.status}', expected 'draft'`)
      }
      if (task.notBefore && !this.#queueAdapter.capabilities.delayedDispatch) {
        throw new Error(
          'Task has notBefore set but the bound QueueAdapter does not support delayed dispatch. ' +
            'Bind a delayed-dispatch-capable adapter or omit notBefore on submit.',
        )
      }
      const update: Partial<Task> = { status: 'pending' }
      if (opts && 'payload' in opts) {
        update.payload = opts.payload
      }
      await this.#taskDs.update(this.#injector, taskId, update)
      return this.#taskDs.get(this.#injector, taskId)
    })

    if (!released) throw new Error(`Task ${taskId} disappeared during start`)

    this.#telemetry.emit('onTaskSubmitted', {
      taskId: released.id,
      type: released.type,
      parentTaskId: released.parentTaskId,
      payloadBytes: estimateSize(released.payload),
    })
    await this.#queueAdapter.enqueue({
      taskId: released.id,
      type: released.type,
      handlerVersion: released.handlerVersion,
      notBefore: released.notBefore ? new Date(released.notBefore) : undefined,
      tags: released.tags,
    })
    return released
  }

  public async cancel(taskId: string, reason?: string): Promise<void> {
    this.#ensureLive()
    await cascadeCancel(this.#cancelDeps, taskId, reason)
  }

  public async get(taskId: string): Promise<Task | undefined> {
    this.#ensureLive()
    return this.#taskDs.get(this.#injector, taskId)
  }

  public async getTree(taskId: string): Promise<TaskTreeNode> {
    this.#ensureLive()
    const task = await this.#taskDs.get(this.#injector, taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    return buildTree(this.#taskDs, this.#injector, task)
  }

  public subscribe(taskId: string, handler: (event: TaskUpdate) => void): Disposable {
    this.#ensureLive()
    return this.#addSubscriber(this.#taskSubs, taskId, handler)
  }

  public subscribeByType(type: string, handler: (event: TaskUpdate) => void): Disposable {
    this.#ensureLive()
    return this.#addSubscriber(this.#typeSubs, type, handler)
  }

  public registerWorker(options: RegisterWorkerOptions): Worker {
    this.#ensureLive()
    const workerId = `worker-${randomUUID()}`
    const handlers = new Map<string, AnyTaskHandlerDescriptor>()
    for (const h of options.handlers) {
      handlers.set(h.type, h)
    }

    const reg: WorkerRegistration = {
      workerId,
      name: options.name,
      concurrency: options.concurrency,
      tags: options.tags,
      compatibleVersions: options.compatibleVersions,
      handlers,
      activeTasks: new Set(),
      draining: false,
      cancelSubscriptions: [],
    }

    // Cross-process cancel subscription per task type — workers receive
    // `tasks/cancel/${type}` broadcasts and intersect against locally
    // held leases (PRD §11).
    for (const type of handlers.keys()) {
      reg.cancelSubscriptions.push(
        this.#bus.subscribe(`tasks/cancel/${type}`, (message) => this.#handleCancelBroadcast(reg, message)),
      )
    }

    const subscription: WorkerSubscription = {
      workerId,
      concurrency: options.concurrency,
      tags: options.tags,
      types: Array.from(handlers.keys()),
      compatibleVersions: options.compatibleVersions,
      shouldDrain: () => reg.draining,
      onClaim: (claim) => this.#handleClaim(reg, claim),
    }
    reg.queueSubscription = this.#queueAdapter.subscribe(subscription)

    this.#workers.set(workerId, reg)

    return {
      name: options.name,
      workerId,
      concurrency: options.concurrency,
      tags: options.tags,
      get activeTaskCount() {
        return reg.activeTasks.size
      },
      drain: async (opts) => {
        reg.draining = true
        if (reg.activeTasks.size === 0) return
        await new Promise<void>((resolve) => {
          reg.drainResolve = resolve
          if (opts?.timeoutMs) setTimeout(resolve, opts.timeoutMs)
        })
      },
      [Symbol.dispose]: () => {
        reg.draining = true
        reg.queueSubscription?.[Symbol.dispose]()
        reg.queueSubscription = undefined
        for (const sub of reg.cancelSubscriptions) sub[Symbol.dispose]()
        reg.cancelSubscriptions.length = 0
        this.#workers.delete(workerId)
        reg.drainResolve?.()
      },
    }
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    clearInterval(this.#reconcilerTimer)
    if (this.#sweepTimer) clearInterval(this.#sweepTimer)
    for (const ac of this.#abortControllers.values()) ac.abort()
    this.#abortControllers.clear()
    this.#taskSubs.clear()
    this.#typeSubs.clear()
    for (const reg of this.#workers.values()) {
      reg.queueSubscription?.[Symbol.dispose]()
      for (const sub of reg.cancelSubscriptions) sub[Symbol.dispose]()
    }
    this.#workers.clear()
  }

  // ── Capability gating ─────────────────────────────────────────────

  #validateNotBefore<TPayload>(args: SubmitOptions<TPayload>): void {
    if (args.notBefore && !this.#queueAdapter.capabilities.delayedDispatch) {
      throw new Error(
        'submit({ notBefore }) requires a QueueAdapter that supports delayed dispatch. ' +
          'Bind a delayed-dispatch-capable adapter or omit notBefore.',
      )
    }
  }

  // ── Idempotency ───────────────────────────────────────────────────

  /**
   * Resolves an idempotency key to either the already-persisted task or a
   * reserved task id to persist under.
   *
   * The reserved id is the same id used as the adapter lease value, so a
   * winning submit persists under the id every loser observes. A loser
   * whose winner has not finished persisting yet polls
   * {@link TaskRunnerCore.#findByIdempotencyKey} a few times before
   * falling through to its own reserved id — the fall-through only
   * triggers when the winner crashed between lease and persist, which is
   * rare and self-heals on the next submit.
   */
  async #resolveIdempotency(type: string, key: string): Promise<{ existing?: Task; reservedId?: string }> {
    const existing = await findByIdempotencyKey(this.#taskDs, this.#injector, key, type)
    if (existing) return { existing }

    if (!this.#queueAdapter.acquireIdempotencyLease) return {}

    const proposed = randomUUID()
    const winner = await this.#queueAdapter.acquireIdempotencyLease({ type, key, taskId: proposed })
    if (winner === proposed) return { reservedId: proposed }

    const found = await this.#pollForIdempotent(key, type)
    if (found) return { existing: found }
    return { reservedId: proposed }
  }

  async #pollForIdempotent(key: string, type: string): Promise<Task | undefined> {
    for (let attempt = 0; attempt < IDEMPOTENCY_FIND_RETRIES; attempt++) {
      await waitMs(IDEMPOTENCY_FIND_DELAY_MS)
      const found = await findByIdempotencyKey(this.#taskDs, this.#injector, key, type)
      if (found) return found
    }
    return undefined
  }

  // ── Initial-task persistence ──────────────────────────────────────

  async #persistInitialTask<TPayload>(
    args: SubmitOptions<TPayload>,
    status: 'pending' | 'draft',
    reservedId?: string,
  ): Promise<Task> {
    const now = new Date().toISOString()
    const taskId = reservedId ?? randomUUID()

    if (args.parentTaskId) {
      const hasCycle = await detectCycle(this.#taskDs, this.#injector, taskId, args.parentTaskId)
      if (hasCycle) throw new Error(`DAG cycle detected: ${taskId} → ${args.parentTaskId}`)
    }

    const task: Task = Object.assign(new Task(), {
      id: taskId,
      type: args.type,
      handlerVersion: args.handlerVersion,
      status,
      payload: args.payload,
      childTaskIds: [],
      submittedAt: now,
      submittedBy: args.submittedBy,
      notBefore: args.notBefore?.toISOString(),
      idempotencyKey: args.idempotencyKey,
      attempts: [],
      events: [{ at: now, kind: 'submitted' as const }],
      producedBlobs: [],
      consumedBlobs: [],
      retentionPolicy: { ...DEFAULT_RETENTION_POLICY, ...args.retentionPolicy },
      tags: args.tags ?? [],
      parentTaskId: args.parentTaskId,
    })

    const result = await this.#taskDs.add(this.#injector, task)
    return result.created[0]
  }

  // ── Cancel broadcast ──────────────────────────────────────────────

  #handleCancelBroadcast(worker: WorkerRegistration, message: BusMessage): void {
    const payload = message.payload as CancelBroadcastPayload | null
    if (!payload || !Array.isArray(payload.taskIds)) return
    for (const taskId of payload.taskIds) {
      if (!worker.activeTasks.has(taskId)) continue
      const ac = this.#abortControllers.get(taskId)
      ac?.abort()
    }
  }

  // ── Claim handling ────────────────────────────────────────────────

  /**
   * Per-claim entry point invoked by the queue adapter for a worker
   * subscription. Materializes the task from the dataset, runs the
   * handler, and translates the runtime outcome into a
   * {@link ClaimOutcome} the adapter can ack on.
   *
   * The claim-transition block (status read → AC install →
   * `'claimed'` write) runs inside {@link TaskRunnerCore.#withTaskLock}
   * so it cannot interleave with {@link TaskRunnerCore.#cascadeCancel}.
   * Without the lock, cascade reading status `'running'` before the AC
   * is installed would fall through the no-AC branch and write
   * `'cancelled'` while the handler kept running.
   */
  async #handleClaim(worker: WorkerRegistration, claim: ClaimedTask): Promise<ClaimOutcome> {
    if (worker.draining) return { kind: 'requeue' }

    const setup = await this.#withTaskLock<ClaimSetup | ClaimReject>(claim.taskId, () =>
      this.#setupClaim(worker, claim),
    )

    if (setup.kind !== 'claimed') return setup

    const { task, handler, ac, attempt, claimTime } = setup

    this.#emit(task.type, { kind: 'status', taskId: task.id, status: 'claimed', at: claimTime })
    this.#telemetry.emit('onTaskClaimed', {
      taskId: task.id,
      type: task.type,
      workerId: worker.workerId,
      queueLagMs: Date.now() - Date.parse(task.submittedAt),
    })
    this.#emit(task.type, { kind: 'status', taskId: task.id, status: 'running', at: new Date().toISOString() })

    try {
      return await this.#runHandler(task.id, task.type, task.payload, handler, attempt, ac)
    } finally {
      worker.activeTasks.delete(task.id)
      if (worker.draining && worker.activeTasks.size === 0) worker.drainResolve?.()
    }
  }

  /**
   * The locked claim transition: validate the task against the worker
   * (status, handler presence, version, tags), recover a reclaimed attempt,
   * install the abort controller, and persist `pending → running` in a single
   * write. Must run inside {@link TaskRunnerCore.#withTaskLock} so it cannot
   * interleave with a cancel cascade (see {@link TaskRunnerCore.#handleClaim}).
   */
  async #setupClaim(worker: WorkerRegistration, claim: ClaimedTask): Promise<ClaimSetup | ClaimReject> {
    const task = await this.#taskDs.get(this.#injector, claim.taskId)
    if (!task) return { kind: 'success' }

    const isReclaim = task.status === 'claimed' || task.status === 'running'
    if (task.status !== 'pending' && task.status !== 'cancelling' && !isReclaim) {
      return { kind: 'success' }
    }

    const handler = worker.handlers.get(task.type)
    if (!handler) return { kind: 'requeue' }

    const versions = worker.compatibleVersions[task.type]
    if (versions?.length && !versions.includes(task.handlerVersion)) {
      return { kind: 'requeue' }
    }

    // Tag constraint (PRD §11): the worker must advertise every tag the
    // task requires. Release back to the queue for a worker that does.
    if (!workerSatisfiesTags(worker.tags, task.tags)) {
      return { kind: 'requeue' }
    }

    // Reclaim: a broker-delivered claim arrived while the dataset
    // still says the prior attempt is in-flight. Abort the prior AC
    // (best-effort cleanup of the stalled handler) and finalize the
    // in-progress attempt as `'timed-out'` so the audit trail
    // distinguishes a stalled attempt from a normal failure.
    let { attempts } = task
    if (isReclaim) {
      const priorAc = this.#abortControllers.get(task.id)
      if (priorAc) {
        priorAc.abort()
        this.#abortControllers.delete(task.id)
      }
      const finalizedAt = new Date().toISOString()
      attempts = attempts.map((entry) =>
        entry.status === 'in-progress' ? { ...entry, status: 'timed-out' as const, finishedAt: finalizedAt } : entry,
      )
      // The timed-out fix is persisted together with the new attempt by
      // the single claim write below — no separate update needed here.
    }

    const ac = new AbortController()
    this.#abortControllers.set(task.id, ac)
    if (task.status === 'cancelling') ac.abort()

    worker.activeTasks.add(task.id)
    const attempt = attempts.length + 1
    const claimTime = new Date().toISOString()

    // Collapse the claim transition into a single read-modify-write:
    // persist the running status, worker/visibility lease, the new
    // in-progress attempt, and the `claimed` event in one update instead
    // of four (`claimed` status → `pushAttempt` → `pushEvent` → `running`
    // status, each its own get+update). The intermediate `claimed` row
    // state is never persisted (status goes pending → running); both
    // status events still emit on the hot lane below for subscribers.
    const nextAttempts: AttemptRecord[] = [
      ...attempts,
      { attempt, workerId: worker.workerId, startedAt: claimTime, status: 'in-progress' },
    ]
    const nextEvents: TaskEvent[] = [...task.events, { at: claimTime, kind: 'claimed', workerId: worker.workerId }]
    if (nextEvents.length > MAX_EVENTS_PER_TASK) nextEvents.splice(0, nextEvents.length - MAX_EVENTS_PER_TASK)

    await this.#taskDs.update(this.#injector, task.id, {
      status: 'running',
      workerId: worker.workerId,
      visibilityDeadline: new Date(Date.now() + handler.visibilityTimeoutMs).toISOString(),
      attempts: nextAttempts,
      events: nextEvents,
    })

    return {
      kind: 'claimed',
      task: { ...task, attempts: nextAttempts, events: nextEvents },
      handler,
      ac,
      attempt,
      claimTime,
    }
  }

  async #runHandler(
    taskId: string,
    type: string,
    payload: unknown,
    handler: AnyTaskHandlerDescriptor,
    attempt: number,
    ac: AbortController,
  ): Promise<ClaimOutcome> {
    // First attempt has no replay log yet — skip the load (a `find` that
    // scans the whole replay store). Continuations after a crash or an
    // `awaitChildren` suspension always run as attempt > 1, where replay
    // entries may exist and must be loaded.
    const replayIndex = buildReplayIndex(attempt > 1 ? await this.#loadReplayLog(taskId) : [])
    let stepIndex = 0
    let lastProgressMs = 0

    const ctx = buildTaskContext(this.#contextDeps, {
      taskId,
      type,
      attempt,
      payload,
      visibilityTimeoutMs: handler.visibilityTimeoutMs,
      progressThrottleMs: handler.progressThrottleMs,
      signal: ac.signal,
      replayIndex,
      nextStep: () => stepIndex++,
      setLastProgress: (t) => {
        lastProgressMs = t
      },
      getLastProgress: () => lastProgressMs,
    })

    const startMs = Date.now()
    const isStillOwning = (): boolean => this.#abortControllers.get(taskId) === ac
    try {
      const result: unknown = await handler.handler(ctx, payload)

      // Reclaim race: our AC was replaced by a fresh attempt (broker-side
      // visibility reclaim). The new attempt owns the dataset row — exit
      // silently so we don't trample its status writes.
      if (!isStillOwning()) return { kind: 'success' }
      this.#abortControllers.delete(taskId)

      await this.#taskDs.update(this.#injector, taskId, {
        status: 'succeeded',
        result,
        terminalAt: new Date().toISOString(),
      })
      await this.#finalizeAttempt(taskId, attempt, 'succeeded')
      this.#emit(type, { kind: 'status', taskId, status: 'succeeded', at: new Date().toISOString() })
      this.#telemetry.emit('onTaskCompleted', {
        taskId,
        type,
        status: 'succeeded',
        attempt,
        durationMs: Date.now() - startMs,
      })
      await reapOrphans(this.#cancelDeps, taskId, 'parent-completed')
      await wakeParent(this.#ops, taskId)
      return { kind: 'success' }
    } catch (err) {
      const stillOwning = isStillOwning()
      if (stillOwning) this.#abortControllers.delete(taskId)

      if (isSuspendedError(err)) {
        if (!stillOwning) return { kind: 'success' }
        await this.#taskDs.update(this.#injector, taskId, {
          status: 'waiting',
          resumeToken: JSON.stringify(err.awaitedChildIds),
        })
        this.#emit(type, { kind: 'status', taskId, status: 'waiting', at: new Date().toISOString() })
        return { kind: 'suspended' }
      }

      // Reclaim race: AC replaced before the handler unwound. The new
      // attempt has already finalized our entry as `'timed-out'`; just
      // ack the stale claim and leave the dataset alone.
      if (!stillOwning) return { kind: 'success' }

      if (ac.signal.aborted) {
        await this.#taskDs.update(this.#injector, taskId, {
          status: 'cancelled',
          terminalAt: new Date().toISOString(),
        })
        await this.#finalizeAttempt(taskId, attempt, 'cancelled')
        this.#emit(type, { kind: 'status', taskId, status: 'cancelled', at: new Date().toISOString() })
        this.#telemetry.emit('onTaskCancelled', { taskId, type })
        this.#telemetry.emit('onTaskCompleted', {
          taskId,
          type,
          status: 'cancelled',
          attempt,
          durationMs: Date.now() - startMs,
        })
        await wakeParent(this.#ops, taskId)
        return { kind: 'cancelled' }
      }

      return this.#handleFailure(taskId, type, handler, attempt, err, startMs)
    }
  }

  // ── Failure + retry ───────────────────────────────────────────────

  async #handleFailure(
    taskId: string,
    type: string,
    handler: AnyTaskHandlerDescriptor,
    attempt: number,
    error: unknown,
    startMs: number,
  ): Promise<ClaimOutcome> {
    const errInfo = toErrorInfo(error)
    const willRetry = attempt < handler.retryPolicy.maxAttempts

    await this.#pushEvent(taskId, { at: new Date().toISOString(), kind: 'attempt-failed', attempt, willRetry })
    await this.#finalizeAttempt(taskId, attempt, 'failed', errInfo)
    this.#telemetry.emit('onTaskFailed', { taskId, type, attempt, willRetry, error: errInfo })

    if (willRetry) {
      const delay = calculateBackoff(handler.retryPolicy, attempt)
      const nextRunAt = delay > 0 ? new Date(Date.now() + delay) : undefined
      await this.#taskDs.update(this.#injector, taskId, {
        status: 'pending',
        workerId: undefined,
        visibilityDeadline: undefined,
        notBefore: nextRunAt?.toISOString(),
      })
      const task = await this.#taskDs.get(this.#injector, taskId)
      if (task) {
        await this.#queueAdapter.enqueue({
          taskId: task.id,
          type: task.type,
          handlerVersion: task.handlerVersion,
          notBefore: nextRunAt,
          tags: task.tags,
        })
      }
      return { kind: 'failed' }
    }

    await this.#taskDs.update(this.#injector, taskId, {
      status: 'failed',
      error: errInfo,
      terminalAt: new Date().toISOString(),
    })
    this.#emit(type, { kind: 'status', taskId, status: 'failed', at: new Date().toISOString() })
    this.#telemetry.emit('onTaskCompleted', {
      taskId,
      type,
      status: 'failed',
      attempt,
      durationMs: Date.now() - startMs,
    })
    await reapOrphans(this.#cancelDeps, taskId, 'parent-failed')
    await wakeParent(this.#ops, taskId)
    return { kind: 'failed' }
  }

  // ── Visibility sweep (skipped under broker-side reclaim) ─────────

  async #sweepVisibility(): Promise<void> {
    if (this.#disposed) return
    const now = Date.now()

    const tasks = await this.#taskDs.find(this.#injector, {
      filter: { status: { $in: ['claimed', 'running'] } },
    })

    for (const task of tasks) {
      if (!task.visibilityDeadline || Date.parse(task.visibilityDeadline) > now) continue

      for (const w of this.#workers.values()) w.activeTasks.delete(task.id)
      this.#abortControllers.delete(task.id)

      const attempts = [...task.attempts]
      const last = attempts[attempts.length - 1]
      if (last && last.status !== 'timed-out') {
        last.status = 'timed-out'
        last.finishedAt = new Date(now).toISOString()
      }

      await this.#taskDs.update(this.#injector, task.id, {
        status: 'pending',
        workerId: undefined,
        visibilityDeadline: undefined,
        attempts,
      })
      await this.#queueAdapter.enqueue({
        taskId: task.id,
        type: task.type,
        handlerVersion: task.handlerVersion,
        tags: task.tags,
      })
    }
  }

  async #pushEvent(taskId: string, event: TaskEvent): Promise<void> {
    await this.#withTaskLock(taskId, async () => {
      const task = await this.#taskDs.get(this.#injector, taskId)
      if (!task) return
      const events = [...task.events, event]
      if (events.length > MAX_EVENTS_PER_TASK) events.splice(0, events.length - MAX_EVENTS_PER_TASK)
      await this.#taskDs.update(this.#injector, taskId, { events })
    })
  }

  async #finalizeAttempt(
    taskId: string,
    attempt: number,
    status: 'succeeded' | 'failed' | 'cancelled' | 'timed-out',
    error?: { name: string; message: string; stack?: string },
  ): Promise<void> {
    await this.#withTaskLock(taskId, async () => {
      const task = await this.#taskDs.get(this.#injector, taskId)
      if (!task) return
      const attempts = task.attempts.map((a) =>
        a.attempt === attempt ? { ...a, status, finishedAt: new Date().toISOString(), ...(error ? { error } : {}) } : a,
      )
      await this.#taskDs.update(this.#injector, taskId, { attempts })
    })
  }

  // ── Replay log ────────────────────────────────────────────────────

  async #loadReplayLog(taskId: string): Promise<TaskReplayLogEntry[]> {
    return this.#replayDs.find(this.#injector, {
      filter: { taskId: { $eq: taskId } },
    })
  }

  async #persistReplayEntry(entry: TaskReplayLogEntry): Promise<void> {
    try {
      await this.#replayDs.add(this.#injector, entry)
    } catch {
      // Dedup: entry already exists from a previous run — safe to swallow
    }
  }

  // ── Subscriber fan-out ────────────────────────────────────────────

  #addSubscriber(
    map: Map<string, Set<(event: TaskUpdate) => void>>,
    key: string,
    handler: (event: TaskUpdate) => void,
  ): Disposable {
    let subs = map.get(key)
    if (!subs) {
      subs = new Set()
      map.set(key, subs)
    }
    subs.add(handler)
    return {
      [Symbol.dispose]: () => {
        const s = map.get(key)
        if (!s) return
        s.delete(handler)
        if (s.size === 0) map.delete(key)
      },
    }
  }

  /**
   * Topic split (PRD §6, §11): `progress` updates ride
   * `tasks/progress/${type}`; status/`spawned-child`/`child-completed`
   * ride `tasks/status/${type}`. Cancel rides its own
   * `tasks/cancel/${type}` topic from {@link TaskRunnerCore.#cascadeCancel}.
   */
  #emit(type: string, update: TaskUpdate): void {
    for (const h of this.#taskSubs.get(update.taskId) ?? []) {
      try {
        h(update)
      } catch {
        /* swallow */
      }
    }
    for (const h of this.#typeSubs.get(type) ?? []) {
      try {
        h(update)
      } catch {
        /* swallow */
      }
    }
    const topic = update.kind === 'progress' ? `tasks/progress/${type}` : `tasks/status/${type}`
    void this.#bus.publish(topic, update).catch(() => {})
  }

  #ensureLive(): void {
    if (this.#disposed) throw new Error('TaskRunnerCore has been disposed')
  }

  /**
   * Serialize `fn` against any other operation on the same `taskId`.
   * Cheap in-process mutex — chains a Promise per taskId, evicts on
   * settle. Errors do not poison the chain.
   */
  async #withTaskLock<T>(taskId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.#taskLocks.get(taskId) ?? Promise.resolve()
    let release: () => void = () => {}
    const next = new Promise<void>((resolve) => {
      release = resolve
    })
    this.#taskLocks.set(taskId, next)
    try {
      await prev
      return await fn()
    } finally {
      release()
      if (this.#taskLocks.get(taskId) === next) this.#taskLocks.delete(taskId)
    }
  }
}
