import { defineService, type Token } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { TaskStatus } from './types.js'

/**
 * Observable lifecycle signals emitted by the runner, sweeper, and blob
 * store. Subscribe via {@link TaskRunnerTelemetryToken} to wire metrics,
 * logging, or tracing without touching the runner internals. `onTaskClaimed`
 * carries `queueLagMs` (claim dwell) — the signal apps build self-throttling
 * dashboards on.
 */
export type TaskRunnerTelemetryEvents = {
  onTaskSubmitted: { taskId: string; type: string; parentTaskId?: string; payloadBytes: number }
  onTaskClaimed: { taskId: string; type: string; workerId: string; queueLagMs: number }
  onTaskCompleted: { taskId: string; type: string; status: TaskStatus; attempt: number; durationMs: number }
  onTaskFailed: {
    taskId: string
    type: string
    attempt: number
    willRetry: boolean
    error: { name: string; message: string }
  }
  onTaskCancelled: { taskId: string; type: string; cascadeFromTaskId?: string }
  onTaskProgress: { taskId: string; percent: number; meta?: Record<string, unknown> }
  onBlobPut: { key: string; byteLength: number; durationMs: number }
  onBlobGet: { key: string; byteLength: number; durationMs: number }
  onBlobDelete: { key: string; durationMs: number }
  onSweeperRun: { scannedCount: number; sweptCount: number; deletedBlobCount: number; durationMs: number }
  onSweeperBlobDeleted: { taskId: string; type: string; key: string; reason: 'produced' | 'consumed' }
}

/** Typed {@link EventHub} of {@link TaskRunnerTelemetryEvents}. Resolve via {@link TaskRunnerTelemetryToken}. */
export class TaskRunnerTelemetry extends EventHub<TaskRunnerTelemetryEvents> {}

/** Shared telemetry hub. Has a working default — no binding required for single-node use. */
export const TaskRunnerTelemetryToken: Token<TaskRunnerTelemetry, 'singleton'> = defineService({
  name: 'furystack/task-runner/TaskRunnerTelemetry',
  lifetime: 'singleton',
  factory: ({ onDispose }) => {
    const telemetry = new TaskRunnerTelemetry()
    // eslint-disable-next-line furystack/prefer-using-wrapper -- disposal delegated to onDispose
    onDispose(() => telemetry[Symbol.dispose]())
    return telemetry
  },
})
