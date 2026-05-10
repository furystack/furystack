import type { BlobStore } from '@furystack/blob-store'
import type { DataSet } from '@furystack/repository'
import type { BusMessage, CrossNodeBus } from '@furystack/cross-node-bus'
import type { Injector, ServiceFactory } from '@furystack/inject'
import { BlobStore as BlobStoreToken } from '@furystack/blob-store'
import { CrossNodeBus as CrossNodeBusToken } from '@furystack/cross-node-bus'
import type { AnyTaskHandlerDescriptor } from './define-task-handler.js'
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
import { isSuspendedError } from './suspended-error.js'
import { calculateBackoff } from './retry-policy.js'
import { randomUUID } from 'node:crypto'
import { TaskRunnerTelemetryToken, type TaskRunnerTelemetry } from './task-runner-telemetry.js'
import { TaskDataSet, TaskReplayLogDataSet } from './task-data-set.js'
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
  /** Per-type cancel-topic subscriptions held for the lifetime of the worker. */
  cancelSubscriptions: Disposable[]
}

/**
 * Payload shape for `tasks/cancel/${type}` bus messages. Workers subscribe
 * to this topic for every task type they declare, intersect the carried
 * task ids with their own held leases, and abort matching cancellation
 * signals (PRD §11 cancel transport).
 */
type CancelBroadcastPayload = { taskIds: string[] }

type PendingTask = {
  taskId: string
  type: string
  notBefore?: number
}

export type InProcessTaskRunnerOptions = {
  reconcilerIntervalMs?: number
  sweepIntervalMs?: number
}

/**
 * Single-process {@link TaskRunner}. All queue, replay, and dispatch state
 * lives in the process — there is no broker. Suitable for tests, local
 * development, and single-node deployments. For multi-node deployments use
 * a persistent runner adapter (see Milestone 3 of the PRD) and bind a
 * cross-node-capable bus + blob store.
 *
 * Persisted state still flows through {@link TaskDataSet} and
 * {@link TaskReplayLogDataSet}, so apps can swap the in-memory stores for
 * any other adapter without changing handler code.
 *
 * Read-modify-write paths against the persisted task (parent child-id
 * append, attempt updates, event log append) are serialized per `taskId`
 * via an internal mutex chain so concurrent `spawnChild` / `pushEvent`
 * calls cannot lose writes.
 */
export class InProcessTaskRunner implements TaskRunner {
  public readonly capabilities: TaskRunnerCapabilities = Object.freeze({
    persistent: false,
    fleetCapEnforcement: false,
    delayedDispatch: true,
    maxPayloadBytes: Infinity,
  })

  readonly #injector: Injector
  readonly #taskDs: DataSet<Task, 'id'>
  readonly #replayDs: DataSet<TaskReplayLogEntry, 'id'>
  readonly #bus: CrossNodeBus
  readonly #telemetry: TaskRunnerTelemetry

  readonly #pendingQueues = new Map<string, PendingTask[]>()
  readonly #workers = new Map<string, WorkerRegistration>()
  readonly #taskSubs = new Map<string, Set<(event: TaskUpdate) => void>>()
  readonly #typeSubs = new Map<string, Set<(event: TaskUpdate) => void>>()
  readonly #abortControllers = new Map<string, AbortController>()

  /**
   * Per-task serialization chain. Every read-modify-write of a persisted
   * task field appends to the chain so concurrent operations produce a
   * consistent final state.
   */
  readonly #taskLocks = new Map<string, Promise<void>>()

  readonly #reconcilerTimer: ReturnType<typeof setInterval>
  readonly #sweepTimer: ReturnType<typeof setInterval>

  readonly #contextDeps: TaskContextFactoryDeps

  #disposed = false

  constructor(
    injector: Injector,
    bus: CrossNodeBus,
    blobStore: BlobStore,
    taskDs: DataSet<Task, 'id'>,
    replayDs: DataSet<TaskReplayLogEntry, 'id'>,
    telemetry: TaskRunnerTelemetry,
    options?: InProcessTaskRunnerOptions,
  ) {
    this.#injector = injector
    this.#bus = bus
    this.#taskDs = taskDs
    this.#replayDs = replayDs
    this.#telemetry = telemetry

    this.#contextDeps = {
      injector,
      blobStore,
      taskDs,
      telemetry,
      emit: (type, update) => this.#emit(type, update),
      persistReplayEntry: (entry) => this.#persistReplayEntry(entry),
      submitChild: (parentId, parentType, childId, childType, childPayload, retention, tags) =>
        this.#submitChild(parentId, parentType, childId, childType, childPayload, retention, tags),
      allChildrenTerminal: (ids) => this.#allChildrenTerminal(ids),
      withTaskLock: (taskId, fn) => this.#withTaskLock(taskId, fn),
    }

    this.#reconcilerTimer = setInterval(() => void this.#reconcile(), options?.reconcilerIntervalMs ?? 30_000)
    this.#sweepTimer = setInterval(() => void this.#sweepVisibility(), options?.sweepIntervalMs ?? 1_000)
  }

  // ── Public API ────────────────────────────────────────────────────

  public async submit<TPayload = unknown>(args: SubmitOptions<TPayload>): Promise<Task> {
    this.#ensureLive()

    if (args.idempotencyKey) {
      const existing = await this.#findByIdempotencyKey(args.idempotencyKey, args.type)
      if (existing) return existing
    }

    const persisted = await this.#persistInitialTask(args, 'pending')
    this.#telemetry.emit('onTaskSubmitted', {
      taskId: persisted.id,
      type: persisted.type,
      parentTaskId: persisted.parentTaskId,
      payloadBytes: estimateSize(persisted.payload),
    })
    this.#enqueue(persisted)
    this.#tryDispatch()
    return persisted
  }

  public async draft<TPayload = unknown>(args: SubmitOptions<TPayload>): Promise<Task> {
    this.#ensureLive()

    if (args.idempotencyKey) {
      const existing = await this.#findByIdempotencyKey(args.idempotencyKey, args.type)
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
    this.#enqueue(released)
    this.#tryDispatch()
    return released
  }

  /**
   * Builds and persists an initial Task row in the requested non-terminal
   * status. Shared by {@link InProcessTaskRunner.submit} (status `'pending'`)
   * and {@link InProcessTaskRunner.draft} (status `'draft'`); see
   * {@link InProcessTaskRunner.start} for the draft-release flow.
   */
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

    // Workers subscribe to `tasks/cancel/${type}` for every type they declare
    // so cross-process cancel broadcasts (PRD §11) reach handlers running on
    // any node. The handler intersects payload `taskIds` with the locally
    // held leases — workers without a matching lease ignore the event.
    for (const type of handlers.keys()) {
      reg.cancelSubscriptions.push(
        this.#bus.subscribe(`tasks/cancel/${type}`, (message) => this.#handleCancelBroadcast(reg, message)),
      )
    }

    this.#workers.set(workerId, reg)
    this.#tryDispatch()

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
        for (const sub of reg.cancelSubscriptions) sub[Symbol.dispose]()
        reg.cancelSubscriptions.length = 0
        this.#workers.delete(workerId)
        reg.drainResolve?.()
      },
    }
  }

  /**
   * Cross-node cancel handler — intersects the broadcast `taskIds` with
   * leases held by `worker` and aborts matching cancellation signals.
   * Workers without a matching lease drop the event after a single map
   * lookup. Aborts are idempotent, so the local synchronous abort path
   * (see {@link InProcessTaskRunner.#cascadeCancel}) racing against this
   * handler is harmless.
   */
  #handleCancelBroadcast(worker: WorkerRegistration, message: BusMessage): void {
    const payload = message.payload as CancelBroadcastPayload | null
    if (!payload || !Array.isArray(payload.taskIds)) return
    for (const taskId of payload.taskIds) {
      if (!worker.activeTasks.has(taskId)) continue
      const ac = this.#abortControllers.get(taskId)
      ac?.abort()
    }
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    clearInterval(this.#reconcilerTimer)
    clearInterval(this.#sweepTimer)
    for (const ac of this.#abortControllers.values()) ac.abort()
    this.#abortControllers.clear()
    this.#taskSubs.clear()
    this.#typeSubs.clear()
    this.#workers.clear()
    this.#pendingQueues.clear()
  }

  // ── Queue ─────────────────────────────────────────────────────────

  #enqueue(task: Task): void {
    let q = this.#pendingQueues.get(task.type)
    if (!q) {
      q = []
      this.#pendingQueues.set(task.type, q)
    }
    q.push({ taskId: task.id, type: task.type, notBefore: task.notBefore ? Date.parse(task.notBefore) : undefined })
  }

  #tryDispatch(): void {
    if (this.#disposed) return
    const now = Date.now()

    for (const [type, q] of this.#pendingQueues) {
      const ready = q.filter((t) => !t.notBefore || t.notBefore <= now)
      for (const pending of ready) {
        const w = this.#pickWorker(type)
        if (!w) break
        q.splice(q.indexOf(pending), 1)
        void this.#claimAndExecute(pending.taskId, w).catch(() => {})
      }
      if (q.length === 0) this.#pendingQueues.delete(type)
    }
  }

  #pickWorker(type: string): WorkerRegistration | undefined {
    for (const w of this.#workers.values()) {
      if (w.draining) continue
      if (w.activeTasks.size >= w.concurrency) continue
      if (!w.handlers.has(type)) continue
      return w
    }
    return undefined
  }

  #removePending(taskId: string): void {
    for (const [type, q] of this.#pendingQueues) {
      const idx = q.findIndex((p) => p.taskId === taskId)
      if (idx !== -1) {
        q.splice(idx, 1)
        if (q.length === 0) this.#pendingQueues.delete(type)
        return
      }
    }
  }

  // ── Execution ─────────────────────────────────────────────────────

  async #claimAndExecute(taskId: string, worker: WorkerRegistration): Promise<void> {
    const task = await this.#taskDs.get(this.#injector, taskId)
    if (!task) return
    if (task.status !== 'pending' && task.status !== 'cancelling') return

    const handler = worker.handlers.get(task.type)
    if (!handler) return

    const versions = worker.compatibleVersions[task.type]
    if (versions?.length && !versions.includes(task.handlerVersion)) {
      this.#enqueue(task)
      return
    }

    worker.activeTasks.add(taskId)
    const attempt = task.attempts.length + 1
    const claimTime = new Date().toISOString()

    await this.#taskDs.update(this.#injector, taskId, {
      status: 'claimed',
      workerId: worker.workerId,
      visibilityDeadline: new Date(Date.now() + handler.visibilityTimeoutMs).toISOString(),
    })
    await this.#pushAttempt(taskId, { attempt, workerId: worker.workerId, startedAt: claimTime, status: 'in-progress' })
    await this.#pushEvent(taskId, { at: claimTime, kind: 'claimed', workerId: worker.workerId })
    this.#emit(task.type, { kind: 'status', taskId, status: 'claimed', at: claimTime })
    this.#telemetry.emit('onTaskClaimed', {
      taskId,
      type: task.type,
      workerId: worker.workerId,
      queueLagMs: Date.now() - Date.parse(task.submittedAt),
    })

    await this.#taskDs.update(this.#injector, taskId, { status: 'running' })
    this.#emit(task.type, { kind: 'status', taskId, status: 'running', at: new Date().toISOString() })

    try {
      await this.#runHandler(taskId, task.type, task.payload, handler, attempt)
    } finally {
      worker.activeTasks.delete(taskId)
      if (worker.draining && worker.activeTasks.size === 0) worker.drainResolve?.()
      this.#tryDispatch()
    }
  }

  async #runHandler(
    taskId: string,
    type: string,
    payload: unknown,
    handler: AnyTaskHandlerDescriptor,
    attempt: number,
  ): Promise<void> {
    const ac = new AbortController()
    this.#abortControllers.set(taskId, ac)

    const currentTask = await this.#taskDs.get(this.#injector, taskId)
    if (currentTask?.status === 'cancelling') ac.abort()

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
    try {
      const result: unknown = await handler.handler(ctx, payload)
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
    } catch (err) {
      this.#abortControllers.delete(taskId)

      if (isSuspendedError(err)) {
        await this.#taskDs.update(this.#injector, taskId, {
          status: 'waiting',
          resumeToken: JSON.stringify(err.awaitedChildIds),
        })
        this.#emit(type, { kind: 'status', taskId, status: 'waiting', at: new Date().toISOString() })
        return
      }

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
        return
      }

      await this.#handleFailure(taskId, type, handler, attempt, err, startMs)
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
  ): Promise<void> {
    const errInfo = toErrorInfo(error)
    const willRetry = attempt < handler.retryPolicy.maxAttempts

    await this.#pushEvent(taskId, { at: new Date().toISOString(), kind: 'attempt-failed', attempt, willRetry })
    await this.#finalizeAttempt(taskId, attempt, 'failed', errInfo)
    this.#telemetry.emit('onTaskFailed', { taskId, type, attempt, willRetry, error: errInfo })

    if (willRetry) {
      const delay = calculateBackoff(handler.retryPolicy, attempt)
      await this.#taskDs.update(this.#injector, taskId, {
        status: 'pending',
        workerId: undefined,
        visibilityDeadline: undefined,
        notBefore: delay > 0 ? new Date(Date.now() + delay).toISOString() : undefined,
      })
      const task = await this.#taskDs.get(this.#injector, taskId)
      if (task) {
        this.#enqueue(task)
        if (delay > 0) setTimeout(() => this.#tryDispatch(), delay)
        else this.#tryDispatch()
      }
    } else {
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
    }
  }

  // ── Cancellation ──────────────────────────────────────────────────

  async #cascadeCancel(rootTaskId: string, reason?: string): Promise<void> {
    const visited = new Set<string>()
    const queue: string[] = [rootTaskId]
    /**
     * Affected task ids grouped by task type; one bus publish per type at
     * the end of the cascade carries the full batch so other nodes can
     * intersect against locally held leases in a single pass (PRD §11).
     */
    const broadcastByType = new Map<string, string[]>()

    while (queue.length > 0) {
      const taskId = queue.shift() as string
      if (visited.has(taskId)) continue
      visited.add(taskId)

      const task = await this.#taskDs.get(this.#injector, taskId)
      if (!task || isTerminalStatus(task.status)) continue

      if (reason !== undefined) {
        await this.#pushEvent(taskId, { at: new Date().toISOString(), kind: 'cancellation-requested', reason })
      }

      const ac = this.#abortControllers.get(taskId)
      if (ac) {
        await this.#taskDs.update(this.#injector, taskId, { status: 'cancelling' })
        this.#emit(task.type, { kind: 'status', taskId, status: 'cancelling', at: new Date().toISOString(), reason })
        ac.abort()
      } else {
        this.#removePending(taskId)
        await this.#taskDs.update(this.#injector, taskId, { status: 'cancelled' })
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

    // Three convergence paths can call this for the same child completion
    // (originating worker, bus-driven backup, periodic reconciler). The lock
    // serializes them; inside the lock we dedup the event log + emit fan-out
    // against an existing `child-completed` entry, and only flip the
    // `waiting → pending` transition once. Event recording runs whenever
    // the parent is non-terminal — sibling completions arriving after the
    // first wake already transitioned the parent must still be recorded
    // on the audit trail.
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
      this.#enqueue(result.transitioned)
      this.#tryDispatch()
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

    this.#enqueue(child)
    this.#tryDispatch()
  }

  // ── Visibility sweep ──────────────────────────────────────────────

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
      this.#enqueue(task)
    }
    this.#tryDispatch()
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
      // Same race as #wakeParent — guard the transition with the per-task lock.
      const transitioned = await this.#withTaskLock(task.id, async () => {
        const fresh = await this.#taskDs.get(this.#injector, task.id)
        if (!fresh || fresh.status !== 'waiting') return undefined
        if (!(await this.#allChildrenTerminal(awaited))) return undefined
        await this.#taskDs.update(this.#injector, task.id, { status: 'pending', resumeToken: undefined })
        return fresh
      })
      if (transitioned) this.#enqueue(transitioned)
    }
    this.#tryDispatch()
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
   * Fan a {@link TaskUpdate} to local subscribers and re-publish it on the
   * cross-node bus.
   *
   * Topic split (PRD §6, §11): `progress` updates ride the high-frequency
   * `tasks/progress/${type}` topic so workers and admin/UI nodes can opt
   * in or out of the progress firehose independently from the
   * lower-frequency `tasks/status/${type}` topic that carries status
   * flips, child spawns, and child completions. Cancellation rides its
   * own `tasks/cancel/${type}` topic with a different payload shape and
   * is published from {@link InProcessTaskRunner.#cascadeCancel}.
   *
   * The bus publish is the runner's "hot lane" (PRD §11) — multi-process
   * deployments running a persistent runner backend on a cross-node bus
   * subscribe to these topics for low-latency progress fan-out. The
   * in-process runner publishes the same envelopes so a single set of
   * subscribers works across deployment shapes; on a single node, with
   * `InProcessCrossNodeBus` as the bus, this round-trip is cheap.
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
    if (this.#disposed) throw new Error('InProcessTaskRunner has been disposed')
  }

  /**
   * Serialize `fn` against any other operation on the same `taskId`. Cheap
   * in-process mutex: chains a Promise per taskId, evicts when settled.
   * Errors do not poison the chain — subsequent waiters proceed regardless.
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

// ── Factory ───────────────────────────────────────────────────────────

export type DefineInProcessTaskRunnerOptions = InProcessTaskRunnerOptions

/**
 * Builds a `ServiceFactory` for the {@link TaskRunner} token bound to an
 * {@link InProcessTaskRunner}. Pulls `CrossNodeBus`, `BlobStore`,
 * `TaskDataSet`, `TaskReplayLogDataSet`, and `TaskRunnerTelemetryToken`
 * out of the injector at resolve time — bind those before resolving the
 * runner.
 *
 * @example
 * ```typescript
 * await using injector = createInjector()
 * injector.bind(BlobStore, ({ onDispose }) => {
 *   const store = new InMemoryBlobStore({ name: 'blobs' })
 *   onDispose(() => store[Symbol.dispose]())
 *   return store
 * })
 * injector.bind(TaskRunner, defineInProcessTaskRunner({ sweepIntervalMs: 200 }))
 * ```
 */
export const defineInProcessTaskRunner = (options?: DefineInProcessTaskRunnerOptions): ServiceFactory<TaskRunner> => {
  return ({ inject, injector, onDispose }) => {
    const bus = inject(CrossNodeBusToken)
    const blobStore = inject(BlobStoreToken)
    const taskDs = inject(TaskDataSet)
    const replayDs = inject(TaskReplayLogDataSet)
    const telemetry = inject(TaskRunnerTelemetryToken)

    const runner = new InProcessTaskRunner(injector, bus, blobStore, taskDs, replayDs, telemetry, options)
    // eslint-disable-next-line furystack/prefer-using-wrapper -- disposal delegated to onDispose
    onDispose(() => runner[Symbol.dispose]())
    return runner
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
