import { defineService, type Token } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { TaskStatus } from './types.js'

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
}

export class TaskRunnerTelemetry extends EventHub<TaskRunnerTelemetryEvents> {}

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
