import type { Injector } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import type { ChildHandle } from './child-handle.js'
import type { ReplayIndex } from './replay-index.js'
import type { SettledChildResult } from './task-context.js'
import { SuspendedError } from './suspended-error.js'
import type { Task, TaskReplayLogEntry } from './types.js'

/**
 * Fan-in resolution for {@link TaskContext.awaitChildren} /
 * {@link TaskContext.awaitChildrenSettled}, extracted from the context
 * factory so the suspend-or-resolve replay logic is isolated and testable.
 * Both helpers suspend (throw {@link SuspendedError}) until every awaited
 * child is terminal, then record the resolved tuple on the replay log.
 */
export type AwaitChildrenDeps = {
  taskId: string
  injector: Injector
  taskDs: DataSet<Task, 'id'>
  allChildrenTerminal: (ids: string[]) => Promise<boolean>
  persistReplayEntry: (entry: TaskReplayLogEntry) => Promise<void>
}

/**
 * Throwing variant: resolves to the children's results in order, or rejects on
 * the first `failed` / `cancelled` child. Returns the cached tuple on replay.
 */
export const resolveAwaitChildren = async (
  deps: AwaitChildrenDeps,
  handles: ReadonlyArray<ChildHandle<unknown>>,
  step: number,
  replayIndex: ReplayIndex,
): Promise<unknown[]> => {
  const cached = replayIndex.get(step)
  if (cached?.kind === 'await-children' && Array.isArray(cached.output)) {
    return cached.output as unknown[]
  }

  const childIds = handles.map((h) => h.taskId)
  if (!(await deps.allChildrenTerminal(childIds))) throw new SuspendedError(childIds)

  const results: unknown[] = []
  for (const h of handles) {
    const child = await deps.taskDs.get(deps.injector, h.taskId)
    if (!child) throw new Error(`Child task ${h.taskId} not found`)
    if (child.status === 'failed') {
      throw new Error(`Child task ${h.taskId} failed: ${child.error?.message ?? 'unknown'}`)
    }
    if (child.status === 'cancelled') {
      throw new Error(`Child task ${h.taskId} was cancelled`)
    }
    results.push(child.result)
  }

  await deps.persistReplayEntry({
    id: `${deps.taskId}:${step}`,
    taskId: deps.taskId,
    stepIndex: step,
    kind: 'await-children',
    childTaskIds: childIds,
    output: results,
    createdAt: new Date().toISOString(),
  })

  return results
}

/**
 * Settled variant: resolves to a per-child {@link SettledChildResult} instead
 * of rejecting, keeping `cancelled` distinct from `failed`. Recorded under its
 * own `await-children-settled` step kind so it never cross-contaminates a
 * throwing `awaitChildren` step.
 */
export const resolveAwaitChildrenSettled = async (
  deps: AwaitChildrenDeps,
  handles: ReadonlyArray<ChildHandle<unknown>>,
  step: number,
  replayIndex: ReplayIndex,
): Promise<SettledChildResult[]> => {
  const cached = replayIndex.get(step)
  if (cached?.kind === 'await-children-settled' && Array.isArray(cached.output)) {
    return cached.output as SettledChildResult[]
  }

  const childIds = handles.map((h) => h.taskId)
  if (!(await deps.allChildrenTerminal(childIds))) throw new SuspendedError(childIds)

  const results: SettledChildResult[] = []
  for (const h of handles) {
    const child = await deps.taskDs.get(deps.injector, h.taskId)
    if (!child) throw new Error(`Child task ${h.taskId} not found`)
    if (child.status === 'failed') {
      results.push({
        status: 'failed',
        taskId: h.taskId,
        type: h.type,
        error: child.error ?? { name: 'Error', message: 'unknown' },
      })
    } else if (child.status === 'cancelled') {
      results.push({ status: 'cancelled', taskId: h.taskId, type: h.type })
    } else {
      results.push({ status: 'succeeded', taskId: h.taskId, type: h.type, result: child.result })
    }
  }

  await deps.persistReplayEntry({
    id: `${deps.taskId}:${step}`,
    taskId: deps.taskId,
    stepIndex: step,
    kind: 'await-children-settled',
    childTaskIds: childIds,
    output: results,
    createdAt: new Date().toISOString(),
  })

  return results
}
