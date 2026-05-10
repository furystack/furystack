import { randomUUID } from 'node:crypto'
import type { BlobStore } from '@furystack/blob-store'
import type { BusMessage, CrossNodeBus } from '@furystack/cross-node-bus'
import type { Injector } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import type { AnyTaskHandlerDescriptor } from './define-task-handler.js'
import { isSuspendedError } from './suspended-error.js'
import { calculateBackoff } from './retry-policy.js'
import type { ClaimedTask, ClaimOutcome, QueueAdapter, WorkerSubscription } from './queue-adapter.js'
import type {
  RegisterWorkerOptions,
  StartOptions,
  SubmitOptions,
  TaskRunner,
  TaskRunnerCapabilities,
  Worker,
} from './task-runner.js'
import { Task, DEFAULT_RETENTION_POLICY, MAX_EVENTS_PER_TASK, isTerminalStatus } from './types.js'
import type {
  AttemptRecord,
  TaskEvent,
  TaskReplayLogEntry,
  TaskRetentionPolicy,
  TaskStatus,
  TaskTreeNode,
  TaskUpdate,
} from './types.js'
import type { TaskRunnerTelemetry } from './task-runner-telemetry.js'
import { buildReplayIndex, buildTaskContext, type TaskContextFactoryDeps } from './task-context-factory.js'

const parseAwaitedChildIds = (resumeToken: string | undefined): string[] | undefined => {
  if (!resumeToken) return undefined
  try {
    const parsed: unknown = JSON.parse(resumeToken)
    if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')) return parsed
    return undefined
  } catch {
    return undefined
  }
}

const isChildCompletionStatus = (status: TaskStatus): status is 'succeeded' | 'failed' | 'cancelled' =>
  status === 'succeeded' || status === 'failed' || status === 'cancelled'

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

/**
 * Payload shape for `tasks/cancel/${type}` bus messages. Workers subscribe
 * to this topic for every task type they declare, intersect the carried
 * task ids with their own held leases, and abort matching cancellation
 * signals (PRD §11 cancel transport).
 */
type CancelBroadcastPayload = { taskIds: string[] }

export type TaskRunnerCoreOptions = {
  reconcilerIntervalMs?: number
  sweepIntervalMs?: number
}

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

    this.#contextDeps = {
      injector: deps.injector,
      blobStore: deps.blobStore,
      taskDs: deps.taskDs,
      telemetry: deps.telemetry,
      emit: (type, update) => this.#emit(type, update),
      persistReplayEntry: (entry) => this.#persistReplayEntry(entry),
      submitChild: (parentId, parentType, childId, childType, childPayload, retention, tags) =>
        this.#submitChild(parentId, parentType, childId, childType, childPayload, retention, tags),
      allChildrenTerminal: (ids) => this.#allChildrenTerminal(ids),
      withTaskLock: (taskId, fn) => this.#withTaskLock(taskId, fn),
    }

    this.#reconcilerTimer = setInterval(() => void this.#reconcile(), options?.reconcilerIntervalMs ?? 30_000)
    this.#sweepTimer = deps.queueAdapter.capabilities.brokerSideReclaim
      ? undefined
      : setInterval(() => void this.#sweepVisibility(), options?.sweepIntervalMs ?? 1_000)
  }

  // ── Public API ────────────────────────────────────────────────────

  public async submit<TPayload = unknown>(args: SubmitOptions<TPayload>): Promise<Task> {
    this.#ensureLive()
    this.#validateNotBefore(args)

    if (args.idempotencyKey) {
      const existing = await this.#resolveIdempotency(args.type, args.idempotencyKey)
      if (existing) return existing
    }

    const persisted = await this.#persistInitialTask(args, 'pending')
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
    })
    return persisted
  }

  public async draft<TPayload = unknown>(args: SubmitOptions<TPayload>): Promise<Task> {
    this.#ensureLive()

    if (args.idempotencyKey) {
      const existing = await this.#resolveIdempotency(args.type, args.idempotencyKey)
      if (existing) return existing
    }

    return this.#persistInitialTask(args, 'draft')
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
    })
    return released
  }

  public async cancel(taskId: string, reason?: string): Promise<void> {
    this.#ensureLive()
    await this.#cascadeCancel(taskId, reason)
  }

  public async get(taskId: string): Promise<Task | undefined> {
    this.#ensureLive()
    return this.#taskDs.get(this.#injector, taskId)
  }

  public async getTree(taskId: string): Promise<TaskTreeNode> {
    this.#ensureLive()
    const task = await this.#taskDs.get(this.#injector, taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    return this.#buildTree(task)
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

  async #resolveIdempotency(type: string, key: string): Promise<Task | undefined> {
    const existing = await this.#findByIdempotencyKey(key, type)
    if (existing) return existing

    if (!this.#queueAdapter.acquireIdempotencyLease) return undefined

    const proposed = randomUUID()
    const winner = await this.#queueAdapter.acquireIdempotencyLease({ type, key, taskId: proposed })
    if (winner === proposed) return undefined
    return this.#findByIdempotencyKey(key, type)
  }

  // ── Initial-task persistence ──────────────────────────────────────

  async #persistInitialTask<TPayload>(args: SubmitOptions<TPayload>, status: 'pending' | 'draft'): Promise<Task> {
    const now = new Date().toISOString()
    const taskId = randomUUID()

    if (args.parentTaskId) {
      const hasCycle = await this.#detectCycle(taskId, args.parentTaskId)
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

    type ClaimSetup = {
      kind: 'claimed'
      task: Task
      handler: AnyTaskHandlerDescriptor
      ac: AbortController
      attempt: number
      claimTime: string
    }
    type ClaimReject = { kind: 'success' } | { kind: 'requeue' }

    const setup = await this.#withTaskLock<ClaimSetup | ClaimReject>(claim.taskId, async () => {
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
        if (attempts !== task.attempts) {
          await this.#taskDs.update(this.#injector, task.id, { attempts })
        }
      }

      const ac = new AbortController()
      this.#abortControllers.set(task.id, ac)
      if (task.status === 'cancelling') ac.abort()

      worker.activeTasks.add(task.id)
      const attempt = attempts.length + 1
      const claimTime = new Date().toISOString()

      await this.#taskDs.update(this.#injector, task.id, {
        status: 'claimed',
        workerId: worker.workerId,
        visibilityDeadline: new Date(Date.now() + handler.visibilityTimeoutMs).toISOString(),
      })

      return { kind: 'claimed', task: { ...task, attempts }, handler, ac, attempt, claimTime }
    })

    if (setup.kind !== 'claimed') return setup

    const { task, handler, ac, attempt, claimTime } = setup

    await this.#pushAttempt(task.id, {
      attempt,
      workerId: worker.workerId,
      startedAt: claimTime,
      status: 'in-progress',
    })
    await this.#pushEvent(task.id, { at: claimTime, kind: 'claimed', workerId: worker.workerId })
    this.#emit(task.type, { kind: 'status', taskId: task.id, status: 'claimed', at: claimTime })
    this.#telemetry.emit('onTaskClaimed', {
      taskId: task.id,
      type: task.type,
      workerId: worker.workerId,
      queueLagMs: Date.now() - Date.parse(task.submittedAt),
    })

    await this.#taskDs.update(this.#injector, task.id, { status: 'running' })
    this.#emit(task.type, { kind: 'status', taskId: task.id, status: 'running', at: new Date().toISOString() })

    try {
      return await this.#runHandler(task.id, task.type, task.payload, handler, attempt, ac)
    } finally {
      worker.activeTasks.delete(task.id)
      if (worker.draining && worker.activeTasks.size === 0) worker.drainResolve?.()
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
    const replayIndex = buildReplayIndex(await this.#loadReplayLog(taskId))
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

      await this.#taskDs.update(this.#injector, taskId, { status: 'succeeded', result })
      await this.#finalizeAttempt(taskId, attempt, 'succeeded')
      this.#emit(type, { kind: 'status', taskId, status: 'succeeded', at: new Date().toISOString() })
      this.#telemetry.emit('onTaskCompleted', {
        taskId,
        type,
        status: 'succeeded',
        attempt,
        durationMs: Date.now() - startMs,
      })
      await this.#wakeParent(taskId)
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
        await this.#taskDs.update(this.#injector, taskId, { status: 'cancelled' })
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
        await this.#wakeParent(taskId)
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
        })
      }
      return { kind: 'failed' }
    }

    await this.#taskDs.update(this.#injector, taskId, { status: 'failed', error: errInfo })
    this.#emit(type, { kind: 'status', taskId, status: 'failed', at: new Date().toISOString() })
    this.#telemetry.emit('onTaskCompleted', {
      taskId,
      type,
      status: 'failed',
      attempt,
      durationMs: Date.now() - startMs,
    })
    await this.#wakeParent(taskId)
    return { kind: 'failed' }
  }

  // ── Cancellation ──────────────────────────────────────────────────

  async #cascadeCancel(rootTaskId: string, reason?: string): Promise<void> {
    const visited = new Set<string>()
    const queue: string[] = [rootTaskId]
    const broadcastByType = new Map<string, string[]>()

    while (queue.length > 0) {
      const taskId = queue.shift() as string
      if (visited.has(taskId)) continue
      visited.add(taskId)

      // Push the cancellation-requested event first (own lock acquisition,
      // own write). The decision branch below acquires the lock again to
      // atomically read+decide+update — without the lock, a claim
      // transition starting between our `taskDs.get` and our status update
      // could install an AC whose abort we'd miss.
      if (reason !== undefined) {
        await this.#pushEvent(taskId, { at: new Date().toISOString(), kind: 'cancellation-requested', reason })
      }

      const decision = await this.#withTaskLock(taskId, async () => {
        const task = await this.#taskDs.get(this.#injector, taskId)
        if (!task || isTerminalStatus(task.status)) return undefined

        const ac = this.#abortControllers.get(taskId)
        if (ac) {
          await this.#taskDs.update(this.#injector, taskId, { status: 'cancelling' })
          ac.abort()
          return { task, mode: 'cancelling' as const }
        }
        await this.#taskDs.update(this.#injector, taskId, { status: 'cancelled' })
        return { task, mode: 'cancelled' as const }
      })

      if (!decision) continue
      const { task, mode } = decision

      if (mode === 'cancelling') {
        this.#emit(task.type, { kind: 'status', taskId, status: 'cancelling', at: new Date().toISOString(), reason })
      } else {
        this.#emit(task.type, { kind: 'status', taskId, status: 'cancelled', at: new Date().toISOString(), reason })
        this.#telemetry.emit('onTaskCancelled', { taskId, type: task.type })
        await this.#wakeParent(taskId)
      }

      const list = broadcastByType.get(task.type)
      if (list) list.push(taskId)
      else broadcastByType.set(task.type, [taskId])

      for (const childId of task.childTaskIds) {
        if (!visited.has(childId)) queue.push(childId)
      }
    }

    for (const [type, taskIds] of broadcastByType) {
      const payload: CancelBroadcastPayload = { taskIds }
      void this.#bus.publish(`tasks/cancel/${type}`, payload).catch(() => {})
    }
  }

  // ── Parent continuation ───────────────────────────────────────────

  async #wakeParent(childTaskId: string): Promise<void> {
    const child = await this.#taskDs.get(this.#injector, childTaskId)
    if (!child?.parentTaskId || !isChildCompletionStatus(child.status)) return

    const parentId = child.parentTaskId
    const childStatus = child.status
    const at = new Date().toISOString()

    const result = await this.#withTaskLock(parentId, async () => {
      const parent = await this.#taskDs.get(this.#injector, parentId)
      if (!parent || isTerminalStatus(parent.status)) return undefined

      const alreadyRecorded = parent.events.some((e) => e.kind === 'child-completed' && e.childTaskId === childTaskId)

      const update: Partial<Task> = {}

      if (!alreadyRecorded) {
        const events = [...parent.events, { at, kind: 'child-completed' as const, childTaskId, status: childStatus }]
        if (events.length > MAX_EVENTS_PER_TASK) events.splice(0, events.length - MAX_EVENTS_PER_TASK)
        update.events = events
      }

      let shouldTransition = false
      if (parent.status === 'waiting') {
        const awaited = parseAwaitedChildIds(parent.resumeToken) ?? parent.childTaskIds
        shouldTransition = await this.#allChildrenTerminal(awaited)
        if (shouldTransition) {
          update.status = 'pending'
          update.resumeToken = undefined
        }
      }

      if (Object.keys(update).length > 0) {
        await this.#taskDs.update(this.#injector, parentId, update)
      }

      return { parentType: parent.type, alreadyRecorded, transitioned: shouldTransition ? parent : undefined }
    })

    if (!result) return

    if (!result.alreadyRecorded) {
      this.#emit(result.parentType, {
        kind: 'child-completed',
        taskId: parentId,
        childTaskId,
        status: childStatus,
        at,
      })
    }

    if (result.transitioned) {
      await this.#queueAdapter.enqueue({
        taskId: result.transitioned.id,
        type: result.transitioned.type,
        handlerVersion: result.transitioned.handlerVersion,
      })
    }
  }

  async #allChildrenTerminal(ids: string[]): Promise<boolean> {
    for (const id of ids) {
      const child = await this.#taskDs.get(this.#injector, id)
      if (!child || !isTerminalStatus(child.status)) return false
    }
    return true
  }

  // ── Child submit (from spawnChild) ────────────────────────────────

  async #submitChild(
    parentId: string,
    parentType: string,
    childId: string,
    childType: string,
    childPayload: unknown,
    retention: TaskRetentionPolicy,
    tags?: string[],
  ): Promise<void> {
    const now = new Date().toISOString()
    const child: Task = Object.assign(new Task(), {
      id: childId,
      type: childType,
      handlerVersion: 1,
      status: 'pending' satisfies TaskStatus,
      payload: childPayload,
      childTaskIds: [],
      submittedAt: now,
      attempts: [],
      events: [{ at: now, kind: 'submitted' as const }],
      producedBlobs: [],
      consumedBlobs: [],
      retentionPolicy: retention,
      tags: tags ?? [],
      parentTaskId: parentId,
    })

    await this.#taskDs.add(this.#injector, child)

    await this.#withTaskLock(parentId, async () => {
      const parent = await this.#taskDs.get(this.#injector, parentId)
      if (!parent) return
      await this.#taskDs.update(this.#injector, parentId, {
        childTaskIds: [...parent.childTaskIds, childId],
      })
    })

    await this.#pushEvent(parentId, { at: now, kind: 'spawned-child', childTaskId: childId, childType })
    this.#emit(parentType, { kind: 'spawned-child', taskId: parentId, childTaskId: childId, at: now })
    this.#telemetry.emit('onTaskSubmitted', {
      taskId: childId,
      type: childType,
      parentTaskId: parentId,
      payloadBytes: estimateSize(childPayload),
    })

    await this.#queueAdapter.enqueue({
      taskId: childId,
      type: childType,
      handlerVersion: 1,
    })
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
      })
    }
  }

  // ── Reconciler ────────────────────────────────────────────────────

  async #reconcile(): Promise<void> {
    if (this.#disposed) return

    const waiting = await this.#taskDs.find(this.#injector, {
      filter: { status: { $eq: 'waiting' } },
    })

    for (const task of waiting) {
      const awaited = parseAwaitedChildIds(task.resumeToken) ?? task.childTaskIds
      if (awaited.length === 0) continue
      const transitioned = await this.#withTaskLock(task.id, async () => {
        const fresh = await this.#taskDs.get(this.#injector, task.id)
        if (!fresh || fresh.status !== 'waiting') return undefined
        if (!(await this.#allChildrenTerminal(awaited))) return undefined
        await this.#taskDs.update(this.#injector, task.id, { status: 'pending', resumeToken: undefined })
        return fresh
      })
      if (transitioned) {
        await this.#queueAdapter.enqueue({
          taskId: transitioned.id,
          type: transitioned.type,
          handlerVersion: transitioned.handlerVersion,
        })
      }
    }
  }

  // ── Cycle detection ───────────────────────────────────────────────

  async #detectCycle(taskId: string, parentId: string): Promise<boolean> {
    let current: string | undefined = parentId
    const visited = new Set<string>()
    while (current) {
      if (current === taskId) return true
      if (visited.has(current)) return false
      visited.add(current)
      const parent: Task | undefined = await this.#taskDs.get(this.#injector, current)
      current = parent?.parentTaskId
    }
    return false
  }

  // ── Data helpers ──────────────────────────────────────────────────

  async #findByIdempotencyKey(key: string, type: string): Promise<Task | undefined> {
    const results = await this.#taskDs.find(this.#injector, {
      filter: { idempotencyKey: { $eq: key }, type: { $eq: type } },
      top: 1,
    })
    return results[0]
  }

  async #buildTree(task: Task): Promise<TaskTreeNode> {
    const children: TaskTreeNode[] = []
    for (const cid of task.childTaskIds) {
      const child = await this.#taskDs.get(this.#injector, cid)
      if (child) children.push(await this.#buildTree(child))
    }
    return { task, children }
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

  async #pushAttempt(taskId: string, record: AttemptRecord): Promise<void> {
    await this.#withTaskLock(taskId, async () => {
      const task = await this.#taskDs.get(this.#injector, taskId)
      if (!task) return
      await this.#taskDs.update(this.#injector, taskId, { attempts: [...task.attempts, record] })
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

// ── Helpers ───────────────────────────────────────────────────────────

const estimateSize = (value: unknown): number => {
  try {
    return Buffer.byteLength(JSON.stringify(value) ?? '')
  } catch {
    return 0
  }
}

const toErrorInfo = (error: unknown): { name: string; message: string; stack?: string } => {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack }
  return { name: 'Error', message: String(error) }
}
