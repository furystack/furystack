import type { BlobRef } from '@furystack/blob-store'

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

export type AttemptStatus = 'in-progress' | 'succeeded' | 'failed' | 'cancelled' | 'timed-out'

export type AttemptRecord = {
  attempt: number
  workerId: string
  startedAt: string
  finishedAt?: string
  status: AttemptStatus
  error?: { name: string; message: string; stack?: string }
}

export type TaskEvent =
  | { at: string; kind: 'submitted' }
  | { at: string; kind: 'claimed'; workerId: string }
  | { at: string; kind: 'progress-milestone'; percent: number; meta?: Record<string, unknown> }
  | { at: string; kind: 'spawned-child'; childTaskId: string; childType: string }
  | { at: string; kind: 'child-completed'; childTaskId: string; status: 'succeeded' | 'failed' | 'cancelled' }
  | { at: string; kind: 'status-changed'; from: TaskStatus; to: TaskStatus }
  | { at: string; kind: 'attempt-failed'; attempt: number; willRetry: boolean }
  | { at: string; kind: 'cancellation-requested'; reason?: string }

export type TaskRetentionPolicy = {
  onSuccess: 'keep' | 'delete-intermediate' | 'delete-all'
  onFailure: 'keep' | 'delete-all'
  ttlAfterTerminalDays: number
}

export type TaskProgress = {
  percent: number
  meta?: Record<string, unknown>
  updatedAt: string
}

export type TaskError = {
  name: string
  message: string
}

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
}

export const DEFAULT_RETENTION_POLICY: TaskRetentionPolicy = {
  onSuccess: 'keep',
  onFailure: 'keep',
  ttlAfterTerminalDays: 30,
}

export const MAX_EVENTS_PER_TASK = 1000

export type ReplayStepKind = 'spawn-child' | 'await-children' | 'progress' | 'now' | 'random' | 'sleep' | 'fetch'

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

export const TERMINAL_STATUSES: ReadonlySet<TaskStatus> = new Set(['succeeded', 'failed', 'cancelled'])

export const isTerminalStatus = (status: TaskStatus): boolean => TERMINAL_STATUSES.has(status)
