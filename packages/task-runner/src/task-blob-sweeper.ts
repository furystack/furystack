import type { BlobStore } from '@furystack/blob-store'
import { BlobStore as BlobStoreToken } from '@furystack/blob-store'
import { defineService, type Injector, type Token } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import { TaskDataSet } from './task-data-set.js'
import { TaskRunnerTelemetryToken, type TaskRunnerTelemetry } from './task-runner-telemetry.js'
import type { Task, TaskRetentionPolicy } from './types.js'

const MS_PER_DAY = 86_400_000
const DEFAULT_SCAN_INTERVAL_MS = 3_600_000 // 1 hour
const DEFAULT_BATCH_SIZE = 100

const TERMINAL_STATUSES = ['succeeded', 'failed', 'cancelled'] as const

/**
 * Outcome of a single {@link TaskBlobSweeper.runOnce} pass.
 */
export type SweeperRunResult = {
  /** Terminal, not-yet-swept tasks fetched and inspected. */
  scannedCount: number
  /** Tasks whose retention policy was applied (TTL elapsed) and marked swept. */
  sweptCount: number
  /** Blobs deleted across all swept tasks. */
  deletedBlobCount: number
}

/**
 * Options for {@link TaskBlobSweeper} / {@link defineTaskBlobSweeper}.
 */
export type TaskBlobSweeperOptions = {
  /** Interval between automatic scans (ms). Default: 1 hour. */
  scanIntervalMs?: number
  /** Max terminal tasks inspected per scan. Default: 100. */
  batchSize?: number
}

/**
 * Resolves the retention mode that governs a terminal task's blobs.
 * `succeeded` tasks use `onSuccess`; `failed` and `cancelled` both use
 * `onFailure` (PRD §10.3 — cancellation cleans up per the failure policy).
 */
const resolveMode = (task: Task): TaskRetentionPolicy['onSuccess'] =>
  task.status === 'succeeded' ? task.retentionPolicy.onSuccess : task.retentionPolicy.onFailure

/**
 * Background service that enforces blob retention for terminal tasks
 * (PRD §13 Milestone 5). On each scan it pulls a batch of terminal,
 * not-yet-swept tasks, and for every task whose
 * `retentionPolicy.ttlAfterTerminalDays` has elapsed since `terminalAt`
 * it deletes blobs per policy:
 *
 * - `keep` — nothing deleted.
 * - `delete-intermediate` — the task's own `producedBlobs` (its
 *   intermediate artifacts); claimed inputs in `consumedBlobs` are left
 *   for their owning task's retention.
 * - `delete-all` — `producedBlobs` **and** `consumedBlobs`.
 *
 * Each swept task is stamped with `blobsSweptAt` so later scans skip it;
 * blob deletes are idempotent, so a crash mid-sweep is recovered by the
 * next run. Set `scanIntervalMs` to `Infinity` to disable the timer and
 * drive sweeps manually via {@link TaskBlobSweeper.runOnce}.
 *
 * @remarks The Task store must support `{ $eq: undefined }` field filters
 * (absence) to exclude already-swept tasks at the query level — the
 * in-memory store and the FuryStack store adapters do.
 */
export class TaskBlobSweeper implements Disposable {
  readonly #injector: Injector
  readonly #taskDs: DataSet<Task, 'id'>
  readonly #blobStore: BlobStore
  readonly #telemetry: TaskRunnerTelemetry
  readonly #batchSize: number
  readonly #timer: ReturnType<typeof setInterval> | undefined
  #disposed = false

  constructor(
    deps: { injector: Injector; taskDs: DataSet<Task, 'id'>; blobStore: BlobStore; telemetry: TaskRunnerTelemetry },
    options?: TaskBlobSweeperOptions,
  ) {
    this.#injector = deps.injector
    this.#taskDs = deps.taskDs
    this.#blobStore = deps.blobStore
    this.#telemetry = deps.telemetry
    this.#batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE

    const scanIntervalMs = options?.scanIntervalMs ?? DEFAULT_SCAN_INTERVAL_MS
    this.#timer = Number.isFinite(scanIntervalMs) ? setInterval(() => void this.runOnce(), scanIntervalMs) : undefined
  }

  /**
   * Runs a single sweep pass. Safe to call directly (tests, manual
   * triggers). Idempotent: blob deletes are no-ops when already gone and
   * swept tasks are skipped by the `blobsSweptAt` marker.
   */
  public async runOnce(): Promise<SweeperRunResult> {
    if (this.#disposed) return { scannedCount: 0, sweptCount: 0, deletedBlobCount: 0 }
    const startMs = Date.now()

    const tasks = await this.#taskDs.find(this.#injector, {
      filter: { status: { $in: [...TERMINAL_STATUSES] }, blobsSweptAt: { $eq: undefined } },
      top: this.#batchSize,
    })

    let sweptCount = 0
    let deletedBlobCount = 0

    for (const task of tasks) {
      if (task.blobsSweptAt) continue
      if (!this.#isExpired(task, startMs)) continue
      deletedBlobCount += await this.#sweepTask(task)
      sweptCount++
    }

    this.#telemetry.emit('onSweeperRun', {
      scannedCount: tasks.length,
      sweptCount,
      deletedBlobCount,
      durationMs: Date.now() - startMs,
    })

    return { scannedCount: tasks.length, sweptCount, deletedBlobCount }
  }

  #isExpired(task: Task, nowMs: number): boolean {
    const anchor = task.terminalAt ?? task.submittedAt
    const anchorMs = Date.parse(anchor)
    if (Number.isNaN(anchorMs)) return false
    return anchorMs + task.retentionPolicy.ttlAfterTerminalDays * MS_PER_DAY <= nowMs
  }

  async #sweepTask(task: Task): Promise<number> {
    const mode = resolveMode(task)
    const targets: Array<{ key: string; reason: 'produced' | 'consumed' }> = []
    if (mode !== 'keep') {
      for (const blob of task.producedBlobs) targets.push({ key: blob.key, reason: 'produced' })
    }
    if (mode === 'delete-all') {
      for (const blob of task.consumedBlobs) targets.push({ key: blob.key, reason: 'consumed' })
    }

    let deleted = 0
    for (const target of targets) {
      await this.#blobStore.delete(target.key)
      deleted++
      this.#telemetry.emit('onSweeperBlobDeleted', {
        taskId: task.id,
        type: task.type,
        key: target.key,
        reason: target.reason,
      })
    }

    const update: Partial<Task> = { blobsSweptAt: new Date().toISOString() }
    if (mode !== 'keep') update.producedBlobs = []
    if (mode === 'delete-all') update.consumedBlobs = []
    await this.#taskDs.update(this.#injector, task.id, update)

    return deleted
  }

  public [Symbol.dispose](): void {
    if (this.#disposed) return
    this.#disposed = true
    if (this.#timer) clearInterval(this.#timer)
  }
}

/**
 * Mints a singleton DI token for a {@link TaskBlobSweeper}. Resolve it once
 * at boot to start the scan timer; the sweeper is disposed (timer cleared)
 * when the owning injector tears down. Requires `BlobStore`, `TaskDataSet`,
 * and `TaskRunnerTelemetryToken` to be resolvable.
 *
 * @example
 * ```ts
 * import { createInjector } from '@furystack/inject'
 * import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
 * import { defineTaskBlobSweeper } from '@furystack/task-runner'
 *
 * const AppTaskSweeper = defineTaskBlobSweeper({ scanIntervalMs: 1_800_000 })
 *
 * await using injector = createInjector()
 * injector.bind(BlobStore, () => new InMemoryBlobStore({ name: 'blobs' }))
 * injector.get(AppTaskSweeper) // start sweeping
 * ```
 */
export const defineTaskBlobSweeper = (options?: TaskBlobSweeperOptions): Token<TaskBlobSweeper, 'singleton'> =>
  defineService({
    name: 'furystack/task-runner/TaskBlobSweeper',
    lifetime: 'singleton',
    factory: ({ inject, injector, onDispose }) => {
      const taskDs = inject(TaskDataSet)
      const blobStore = inject(BlobStoreToken)
      const telemetry = inject(TaskRunnerTelemetryToken)
      const sweeper = new TaskBlobSweeper({ injector, taskDs, blobStore, telemetry }, options)
      // eslint-disable-next-line furystack/prefer-using-wrapper -- disposal delegated to onDispose
      onDispose(() => sweeper[Symbol.dispose]())
      return sweeper
    },
  })
