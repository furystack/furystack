import { randomUUID } from 'node:crypto'
import type { BlobStore } from '@furystack/blob-store'
import type { DataSet } from '@furystack/repository'
import type { Injector } from '@furystack/inject'
import type { ChildHandle } from './child-handle.js'
import type { SpawnOptions, TaskContext } from './task-context.js'
import type { TaskRunnerTelemetry } from './task-runner-telemetry.js'
import { SuspendedError } from './suspended-error.js'
import { DEFAULT_RETENTION_POLICY } from './types.js'
import type { Task, TaskReplayLogEntry, TaskRetentionPolicy, TaskUpdate } from './types.js'

/**
 * O(1) lookup over the replay log: a `Map<stepIndex, entry>` built once per
 * handler invocation. Replaces an O(n²) per-step linear scan.
 */
export type ReplayIndex = Map<number, TaskReplayLogEntry>

export const buildReplayIndex = (log: TaskReplayLogEntry[]): ReplayIndex => {
  const index: ReplayIndex = new Map()
  for (const entry of log) index.set(entry.stepIndex, entry)
  return index
}

/**
 * Runner-side dependencies the {@link TaskContext} needs to fulfill the
 * handler-facing API. Bundled into a single deps record so the factory has
 * a stable, greppable surface and `InProcessTaskRunner` can pass cohesive
 * captures without leaking the whole runner instance.
 */
export type TaskContextFactoryDeps = {
  injector: Injector
  blobStore: BlobStore
  taskDs: DataSet<Task, 'id'>
  telemetry: TaskRunnerTelemetry
  emit: (type: string, update: TaskUpdate) => void
  persistReplayEntry: (entry: TaskReplayLogEntry) => Promise<void>
  submitChild: (
    parentId: string,
    parentType: string,
    childId: string,
    childType: string,
    childPayload: unknown,
    retention: TaskRetentionPolicy,
    tags?: string[],
  ) => Promise<void>
  allChildrenTerminal: (ids: string[]) => Promise<boolean>
  /**
   * Serializes `fn` against any other operation on the same `taskId` —
   * exposed so {@link TaskContext.heartbeat} can refresh the visibility
   * deadline without racing the runner's read-modify-write paths.
   */
  withTaskLock: <T>(taskId: string, fn: () => Promise<T>) => Promise<T>
}

/**
 * Per-invocation parameters passed alongside the runner deps when building
 * a fresh {@link TaskContext} for a single handler run.
 *
 * `visibilityTimeoutMs` and `progressThrottleMs` are passed in as plain
 * numbers (not as the originating handler descriptor) so the factory never
 * has to traverse a type with `any` generic parameters.
 */
export type BuildTaskContextOptions = {
  taskId: string
  type: string
  attempt: number
  payload: unknown
  visibilityTimeoutMs: number
  progressThrottleMs: number
  signal: AbortSignal
  replayIndex: ReplayIndex
  nextStep: () => number
  setLastProgress: (ms: number) => void
  getLastProgress: () => number
}

/**
 * Builds the {@link TaskContext} object for a handler invocation. Lives in
 * its own file so the runner does not have to inline ~190 lines of closure
 * bookkeeping. All non-trivial branching here is replay-aware: if a cached
 * replay entry exists for the current step, the call short-circuits to the
 * recorded value; otherwise the new value is recorded before returning so a
 * subsequent attempt sees the same outcome.
 */
export const buildTaskContext = (deps: TaskContextFactoryDeps, options: BuildTaskContextOptions): TaskContext => {
  const {
    taskId,
    type,
    attempt,
    payload,
    visibilityTimeoutMs,
    progressThrottleMs,
    signal,
    replayIndex,
    nextStep,
    setLastProgress,
    getLastProgress,
  } = options
  const {
    injector,
    blobStore,
    taskDs,
    telemetry,
    emit,
    persistReplayEntry,
    submitChild,
    allChildrenTerminal,
    withTaskLock,
  } = deps

  const ctx: TaskContext = {
    taskId,
    attempt,
    payload,
    injector,
    blobStore,
    cancellationSignal: signal,

    async heartbeat() {
      await withTaskLock(taskId, () =>
        taskDs.update(injector, taskId, {
          visibilityDeadline: new Date(Date.now() + visibilityTimeoutMs).toISOString(),
        }),
      )
    },

    reportProgress(progress) {
      const now = Date.now()
      if (now - getLastProgress() < progressThrottleMs) return
      setLastProgress(now)
      const at = new Date(now).toISOString()
      // Hot lane is throttled (default 4Hz). The same throttled write also
      // refreshes `visibilityDeadline` so handlers reporting progress are
      // implicitly heartbeating — matches PRD §11 ("heartbeat … refreshes
      // broker-side visibility deadline").
      void taskDs
        .update(injector, taskId, {
          progress: { percent: progress.percent, meta: progress.meta, updatedAt: at },
          visibilityDeadline: new Date(now + visibilityTimeoutMs).toISOString(),
        })
        .catch(() => {})
      emit(type, { kind: 'progress', taskId, percent: progress.percent, meta: progress.meta, at })
      telemetry.emit('onTaskProgress', { taskId, percent: progress.percent, meta: progress.meta })
    },

    async spawnChild<TIn, TOut>(childType: string, childPayload: TIn, opts?: SpawnOptions): Promise<ChildHandle<TOut>> {
      const step = nextStep()
      const cached = replayIndex.get(step)
      if (cached?.kind === 'spawn-child' && typeof cached.childTaskId === 'string') {
        return { taskId: cached.childTaskId, type: childType }
      }

      const childId = randomUUID()
      const retention: TaskRetentionPolicy = { ...DEFAULT_RETENTION_POLICY, ...opts?.retentionPolicy }

      await persistReplayEntry({
        id: `${taskId}:${step}`,
        taskId,
        stepIndex: step,
        kind: 'spawn-child',
        childTaskId: childId,
        createdAt: new Date().toISOString(),
      })

      await submitChild(taskId, type, childId, childType, childPayload, retention, opts?.tags)

      return { taskId: childId, type: childType }
    },

    async awaitChildren<THandles extends Array<ChildHandle<unknown>>>(
      handles: THandles,
    ): Promise<{ [K in keyof THandles]: THandles[K] extends ChildHandle<infer R> ? R : never }> {
      type Tuple = { [K in keyof THandles]: THandles[K] extends ChildHandle<infer R> ? R : never }
      const step = nextStep()
      const cached = replayIndex.get(step)
      if (cached?.kind === 'await-children' && Array.isArray(cached.output)) {
        return cached.output as unknown as Tuple
      }

      const childIds = handles.map((h) => h.taskId)
      const allDone = await allChildrenTerminal(childIds)

      if (!allDone) throw new SuspendedError(childIds)

      const results: unknown[] = []
      for (const h of handles) {
        const child = await taskDs.get(injector, h.taskId)
        if (!child) throw new Error(`Child task ${h.taskId} not found`)
        if (child.status === 'failed') {
          throw new Error(`Child task ${h.taskId} failed: ${child.error?.message ?? 'unknown'}`)
        }
        if (child.status === 'cancelled') {
          throw new Error(`Child task ${h.taskId} was cancelled`)
        }
        results.push(child.result)
      }

      await persistReplayEntry({
        id: `${taskId}:${step}`,
        taskId,
        stepIndex: step,
        kind: 'await-children',
        childTaskIds: childIds,
        output: results,
        createdAt: new Date().toISOString(),
      })

      return results as unknown as Tuple
    },

    async spawnChildAndAwait<TIn, TOut>(childType: string, childPayload: TIn, opts?: SpawnOptions): Promise<TOut> {
      const handle = await ctx.spawnChild<TIn, TOut>(childType, childPayload, opts)
      const [result] = await ctx.awaitChildren([handle])
      return result
    },

    allocateBlob(suffix, opts) {
      const key = `tasks/${taskId}/${suffix}`
      return { storeName: blobStore.storeName, key, contentType: opts?.contentType }
    },

    now() {
      const step = nextStep()
      const cached = replayIndex.get(step)
      if (cached?.kind === 'now' && typeof cached.output === 'string') {
        return new Date(cached.output)
      }

      const value = new Date()
      void persistReplayEntry({
        id: `${taskId}:${step}`,
        taskId,
        stepIndex: step,
        kind: 'now',
        output: value.toISOString(),
        createdAt: value.toISOString(),
      })
      return value
    },

    random() {
      const step = nextStep()
      const cached = replayIndex.get(step)
      if (cached?.kind === 'random' && typeof cached.output === 'number') {
        return cached.output
      }

      const value = Math.random()
      void persistReplayEntry({
        id: `${taskId}:${step}`,
        taskId,
        stepIndex: step,
        kind: 'random',
        output: value,
        createdAt: new Date().toISOString(),
      })
      return value
    },

    async sleep(ms) {
      const step = nextStep()
      const cached = replayIndex.get(step)
      if (cached?.kind === 'sleep') return

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, ms)
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer)
            reject(signal.reason instanceof Error ? signal.reason : new Error('Task cancelled'))
          },
          { once: true },
        )
      })
      await persistReplayEntry({
        id: `${taskId}:${step}`,
        taskId,
        stepIndex: step,
        kind: 'sleep',
        input: ms,
        createdAt: new Date().toISOString(),
      })
    },
  }

  return ctx
}
