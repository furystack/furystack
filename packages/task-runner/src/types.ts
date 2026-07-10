import type { BlobRef } from '@furystack/blob-store'

/**
 * Lifecycle state of a task. The terminal set is `succeeded` / `failed` /
 * `cancelled` (see {@link TERMINAL_STATUSES}); `draft` is the pre-enqueue
 * state of the two-phase submit flow, and `waiting` is a parent suspended
 * on `awaitChildren`.
 */
export type TaskStatus =
  | 'draft' // created, not yet released to the queue (two-phase submit)
  | 'pending' // released, waiting for a worker to claim
  | 'claimed' // a worker holds the lease
  | 'running' // handler started
  | 'waiting' // suspended, waiting for children to terminate
  | 'cancelling' // cancellation requested, propagating
  | 'cancelled' // terminal
  | 'succeeded' // terminal
  | 'failed' // terminal, retries exhausted

/** Outcome of a single handler run. `timed-out` means the visibility lease lapsed mid-run. */
export type AttemptStatus = 'in-progress' | 'succeeded' | 'failed' | 'cancelled' | 'timed-out'

/** One handler execution recorded on a task. A task accrues one per retry / continuation. */
export type AttemptRecord = {
  attempt: number
  workerId: string
  startedAt: string
  finishedAt?: string
  status: AttemptStatus
  error?: { name: string; message: string; stack?: string }
}

/**
 * Append-only audit entry on a task's `events` log. Capped at
 * {@link MAX_EVENTS_PER_TASK}; the cold-lane durable record of lifecycle
 * milestones (the hot lane carries per-percent progress separately).
 */
export type TaskEvent =
  | { at: string; kind: 'submitted' }
  | { at: string; kind: 'claimed'; workerId: string }
  | { at: string; kind: 'progress-milestone'; percent: number; meta?: Record<string, unknown> }
  | { at: string; kind: 'spawned-child'; childTaskId: string; childType: string }
  | { at: string; kind: 'child-completed'; childTaskId: string; status: 'succeeded' | 'failed' | 'cancelled' }
  | { at: string; kind: 'status-changed'; from: TaskStatus; to: TaskStatus }
  | { at: string; kind: 'attempt-failed'; attempt: number; willRetry: boolean }
  | { at: string; kind: 'cancellation-requested'; reason?: string }

/**
 * Per-task blob cleanup contract read by the retention sweeper.
 * `delete-intermediate` drops the task's own `producedBlobs`; `delete-all`
 * also drops `consumedBlobs`. Each task is swept against its own policy —
 * a parent never rewrites a child's.
 */
export type TaskRetentionPolicy = {
  onSuccess: 'keep' | 'delete-intermediate' | 'delete-all'
  onFailure: 'keep' | 'delete-all'
  ttlAfterTerminalDays: number
}

/** Latest coalesced progress snapshot persisted on a task (cold lane). */
export type TaskProgress = {
  percent: number
  meta?: Record<string, unknown>
  updatedAt: string
}

/** Serializable error projection stored on a failed task (no stack — that lives on the attempt). */
export type TaskError = {
  name: string
  message: string
}

/**
 * Event delivered to {@link TaskRunner.subscribe} listeners. Folds both
 * cold-lane status flips and hot-lane progress/child events into one
 * discriminated union keyed on `kind`.
 */
export type TaskUpdate =
  | { kind: 'status'; taskId: string; status: TaskStatus; at: string; reason?: string }
  | { kind: 'progress'; taskId: string; percent: number; meta?: Record<string, unknown>; at: string }
  | { kind: 'spawned-child'; taskId: string; childTaskId: string; at: string }
  | {
      kind: 'child-completed'
      taskId: string
      childTaskId: string
      status: 'succeeded' | 'failed' | 'cancelled'
      at: string
    }

/** Recursive DAG projection returned by {@link TaskRunner.getTree}. */
export type TaskTreeNode = {
  task: Task
  children: TaskTreeNode[]
}

/**
 * Persisted unit of work. The `payload` and `result` are opaque to the
 * framework — apps own their shapes via generic type parameters on
 * `defineTaskHandler`.
 */
export class Task {
  declare id: string
  declare type: string
  declare handlerVersion: number
  declare status: TaskStatus
  declare payload: unknown
  declare result?: unknown
  declare error?: TaskError
  declare progress?: TaskProgress
  declare parentTaskId?: string
  declare childTaskIds: string[]
  declare submittedBy?: string
  declare submittedAt: string
  declare notBefore?: string
  declare idempotencyKey?: string
  declare attempts: AttemptRecord[]
  declare events: TaskEvent[]
  declare producedBlobs: BlobRef[]
  declare consumedBlobs: BlobRef[]
  declare retentionPolicy: TaskRetentionPolicy
  declare tags: string[]
  declare visibilityDeadline?: string
  declare workerId?: string
  declare resumeToken?: string
  /**
   * Wall-clock instant (ISO-8601) the task entered a terminal status
   * (`succeeded` / `failed` / `cancelled`). Anchors the blob-retention TTL
   * (`retentionPolicy.ttlAfterTerminalDays`); the blob sweeper compares it
   * against `now`. Unset while the task is non-terminal.
   */
  declare terminalAt?: string
  /**
   * Wall-clock instant (ISO-8601) the blob sweeper applied this task's
   * retention policy. Set once the sweep completes so subsequent scans skip
   * the task; its presence — not the emptiness of the blob lists — is the
   * dedup marker (a `keep`-policy task is marked without deleting anything).
   */
  declare blobsSweptAt?: string
}

/** Conservative default: keep all blobs for 30 days. Apps opt into deletion per handler. */
export const DEFAULT_RETENTION_POLICY: TaskRetentionPolicy = {
  onSuccess: 'keep',
  onFailure: 'keep',
  ttlAfterTerminalDays: 30,
}

/** Hard cap on a task's `events` log; oldest entries are dropped past this to bound row size. */
export const MAX_EVENTS_PER_TASK = 1000

/** Discriminator for a recorded replay step — one kind per determinism-sensitive `ctx.*` helper. */
export type ReplayStepKind =
  'spawn-child' | 'await-children' | 'await-children-settled' | 'progress' | 'now' | 'random' | 'sleep' | 'fetch'

/**
 * A single recorded step in the replay log. Keyed by composite
 * `id` = `${taskId}:${stepIndex}` for dedup on crash recovery.
 */
export class TaskReplayLogEntry {
  declare id: string
  declare taskId: string
  declare stepIndex: number
  declare kind: ReplayStepKind
  declare input?: unknown
  declare output?: unknown
  declare childTaskId?: string
  declare childTaskIds?: string[]
  declare createdAt: string
}

/** The three statuses past which a task never transitions again. */
export const TERMINAL_STATUSES: ReadonlySet<TaskStatus> = new Set(['succeeded', 'failed', 'cancelled'])

/** True once a task has reached a terminal status and will not transition again. */
export const isTerminalStatus = (status: TaskStatus): boolean => TERMINAL_STATUSES.has(status)
