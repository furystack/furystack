import type { TaskRunner } from '../task-runner.js'
import type { Task } from '../types.js'
import { isTerminalStatus } from '../types.js'

export type RunTaskToCompletionOptions = {
  runner: TaskRunner
  taskId: string
  timeoutMs?: number
  pollIntervalMs?: number
}

/**
 * Polls a task until it reaches a terminal status (`succeeded`, `failed`,
 * `cancelled`). Throws on timeout. Useful in tests that need to await
 * the full lifecycle of a submitted task.
 */
export const runTaskToCompletion = async (options: RunTaskToCompletionOptions): Promise<Task> => {
  const { runner, taskId, timeoutMs = 10_000, pollIntervalMs = 50 } = options
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const task = await runner.get(taskId)
    if (task && isTerminalStatus(task.status)) return task
    await new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  const final = await runner.get(taskId)
  throw new Error(
    `Task ${taskId} did not reach terminal status within ${timeoutMs}ms. ` +
      `Current status: ${final?.status ?? 'not found'}`,
  )
}
