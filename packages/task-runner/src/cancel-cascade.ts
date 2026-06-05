import { isTerminalStatus } from './types.js'
import type { CoreTaskOps } from './task-runner-ops.js'
import type { CancelBroadcastPayload } from './task-runner-internals.js'

/**
 * Cancellation concern for the runner core: the breadth-first cancel cascade
 * over a task's descendants, and orphan reaping when a task reaches a
 * terminal status. Extracted from `TaskRunnerCore` so the cancel transport
 * and the lock/abort-controller interplay live in one place.
 *
 * `wakeParent` is injected (rather than imported) to keep this module free of
 * a cycle with `dag-continuation`.
 */
export type CancelDeps = CoreTaskOps & {
  wakeParent: (childTaskId: string) => Promise<void>
}

/**
 * Breadth-first cancels `rootTaskId` and every descendant. A task with a live
 * handler is flipped to `cancelling` and its abort signal fired; a task with
 * no live handler is finalized `cancelled` directly. Cancelled task ids are
 * broadcast per type on `tasks/cancel/${type}` so other nodes abort their
 * local leases.
 *
 * The per-task decision runs under {@link CoreTaskOps.withTaskLock} so it
 * cannot interleave with a claim transition installing an abort controller.
 */
export const cascadeCancel = async (deps: CancelDeps, rootTaskId: string, reason?: string): Promise<void> => {
  const { taskDs, injector, pushEvent, withTaskLock, abortControllers, emit, telemetry, bus, wakeParent } = deps
  const visited = new Set<string>()
  const queue: string[] = [rootTaskId]
  const broadcastByType = new Map<string, string[]>()

  while (queue.length > 0) {
    const taskId = queue.shift() as string
    if (visited.has(taskId)) continue
    visited.add(taskId)

    // Push the cancellation-requested event first (own lock acquisition, own
    // write). The decision branch below re-acquires the lock to atomically
    // read+decide+update — without the lock, a claim transition starting
    // between the `taskDs.get` and the status update could install an AC
    // whose abort we'd miss.
    if (reason !== undefined) {
      await pushEvent(taskId, { at: new Date().toISOString(), kind: 'cancellation-requested', reason })
    }

    const decision = await withTaskLock(taskId, async () => {
      const task = await taskDs.get(injector, taskId)
      if (!task || isTerminalStatus(task.status)) return undefined

      const ac = abortControllers.get(taskId)
      if (ac) {
        await taskDs.update(injector, taskId, { status: 'cancelling' })
        ac.abort()
        return { task, mode: 'cancelling' as const }
      }
      await taskDs.update(injector, taskId, { status: 'cancelled', terminalAt: new Date().toISOString() })
      return { task, mode: 'cancelled' as const }
    })

    if (!decision) continue
    const { task, mode } = decision

    if (mode === 'cancelling') {
      emit(task.type, { kind: 'status', taskId, status: 'cancelling', at: new Date().toISOString(), reason })
    } else {
      emit(task.type, { kind: 'status', taskId, status: 'cancelled', at: new Date().toISOString(), reason })
      telemetry.emit('onTaskCancelled', { taskId, type: task.type })
      await wakeParent(taskId)
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
    void bus.publish(`tasks/cancel/${type}`, payload).catch(() => {})
  }
}

/**
 * Cancels any still-active descendants of a task that has just reached a
 * terminal status, upholding the invariant that no task outlives its parent.
 * Already-terminal children — the normal `awaitChildren` DAG case — are left
 * untouched. Triggered on parent `succeeded` (catches spawn-without-await) and
 * on final `failed`.
 */
export const reapOrphans = async (deps: CancelDeps, parentTaskId: string, reason: string): Promise<void> => {
  const { taskDs, injector } = deps
  const parent = await taskDs.get(injector, parentTaskId)
  if (!parent) return
  for (const childId of parent.childTaskIds) {
    const child = await taskDs.get(injector, childId)
    if (child && !isTerminalStatus(child.status)) {
      await cascadeCancel(deps, childId, reason)
    }
  }
}
