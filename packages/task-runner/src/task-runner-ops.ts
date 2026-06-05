import type { CrossNodeBus } from '@furystack/cross-node-bus'
import type { Injector } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import type { QueueAdapter } from './queue-adapter.js'
import type { TaskRunnerTelemetry } from './task-runner-telemetry.js'
import type { Task, TaskEvent, TaskUpdate } from './types.js'

/**
 * The runner-core primitives the extracted cancellation / DAG-continuation
 * modules need to operate, passed in as one bag instead of reaching back
 * into `TaskRunnerCore`'s private state. Built once in the core constructor
 * (mirrors the `TaskContextFactoryDeps` pattern). Keeping these as injected
 * collaborators lets each concern module stay a pure, independently-testable
 * function set.
 */
export type CoreTaskOps = {
  injector: Injector
  taskDs: DataSet<Task, 'id'>
  queueAdapter: QueueAdapter
  bus: CrossNodeBus
  telemetry: TaskRunnerTelemetry
  /** Live abort controllers keyed by `taskId` — the cancel path aborts in-flight handlers through this. */
  abortControllers: Map<string, AbortController>
  /** True once the owning core has been disposed; loops bail early. */
  isDisposed: () => boolean
  /** Per-`taskId` mutex shared with the core so module writes can't interleave with claim transitions. */
  withTaskLock: <T>(taskId: string, fn: () => Promise<T>) => Promise<T>
  /** Append a capped audit event to a task (own lock acquisition). */
  pushEvent: (taskId: string, event: TaskEvent) => Promise<void>
  /** Fan an update out to local subscribers and the hot-lane bus topic. */
  emit: (type: string, update: TaskUpdate) => void
}
