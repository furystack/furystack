import { allChildrenTerminal } from './task-queries.js'
import { estimateSize, isChildCompletionStatus, parseAwaitedChildIds } from './task-runner-internals.js'
import { isTerminalStatus, MAX_EVENTS_PER_TASK, Task } from './types.js'
import type { CoreTaskOps } from './task-runner-ops.js'
import type { TaskRetentionPolicy, TaskStatus } from './types.js'

/**
 * DAG-continuation concern for the runner core: recording child completions
 * on parents, resuming a `waiting` parent once its awaited children are all
 * terminal, spawning children from `ctx.spawnChild`, and the reconciler that
 * re-enqueues parents whose wake was missed. Extracted from `TaskRunnerCore`
 * so the parent-resume bookkeeping is isolated and unit-testable.
 */

/**
 * Records that `childTaskId` completed on its parent and, if the parent was
 * `waiting` and every awaited child is now terminal, flips it back to
 * `pending` and re-enqueues it for continuation. No-op when the child has no
 * parent or the parent is already terminal.
 */
export const wakeParent = async (ops: CoreTaskOps, childTaskId: string): Promise<void> => {
  const { taskDs, injector, withTaskLock, emit, queueAdapter } = ops
  const child = await taskDs.get(injector, childTaskId)
  if (!child?.parentTaskId || !isChildCompletionStatus(child.status)) return

  const parentId = child.parentTaskId
  const childStatus = child.status
  const at = new Date().toISOString()

  const result = await withTaskLock(parentId, async () => {
    const parent = await taskDs.get(injector, parentId)
    if (!parent || isTerminalStatus(parent.status)) return undefined

    const alreadyRecorded = parent.events.some((e) => e.kind === 'child-completed' && e.childTaskId === childTaskId)

    const update: Partial<Task> = {}

    if (!alreadyRecorded) {
      const events = [...parent.events, { at, kind: 'child-completed' as const, childTaskId, status: childStatus }]
      if (events.length > MAX_EVENTS_PER_TASK) events.splice(0, events.length - MAX_EVENTS_PER_TASK)
      update.events = events
    }

    let shouldTransition = false
    if (parent.status === 'waiting') {
      const awaited = parseAwaitedChildIds(parent.resumeToken) ?? parent.childTaskIds
      shouldTransition = await allChildrenTerminal(taskDs, injector, awaited)
      if (shouldTransition) {
        update.status = 'pending'
        update.resumeToken = undefined
      }
    }

    if (Object.keys(update).length > 0) {
      await taskDs.update(injector, parentId, update)
    }

    return { parentType: parent.type, alreadyRecorded, transitioned: shouldTransition ? parent : undefined }
  })

  if (!result) return

  if (!result.alreadyRecorded) {
    emit(result.parentType, { kind: 'child-completed', taskId: parentId, childTaskId, status: childStatus, at })
  }

  if (result.transitioned) {
    await queueAdapter.enqueue({
      taskId: result.transitioned.id,
      type: result.transitioned.type,
      handlerVersion: result.transitioned.handlerVersion,
      tags: result.transitioned.tags,
    })
  }
}

/** Persists a spawned child task, links it onto its parent, and enqueues it. */
export const submitChild = async (
  ops: CoreTaskOps,
  parentId: string,
  parentType: string,
  childId: string,
  childType: string,
  childPayload: unknown,
  retention: TaskRetentionPolicy,
  tags?: string[],
): Promise<void> => {
  const { taskDs, injector, withTaskLock, pushEvent, emit, telemetry, queueAdapter } = ops
  const now = new Date().toISOString()
  const child: Task = Object.assign(new Task(), {
    id: childId,
    type: childType,
    handlerVersion: 1,
    status: 'pending' satisfies TaskStatus,
    payload: childPayload,
    childTaskIds: [],
    submittedAt: now,
    attempts: [],
    events: [{ at: now, kind: 'submitted' as const }],
    producedBlobs: [],
    consumedBlobs: [],
    retentionPolicy: retention,
    tags: tags ?? [],
    parentTaskId: parentId,
  })

  await taskDs.add(injector, child)

  await withTaskLock(parentId, async () => {
    const parent = await taskDs.get(injector, parentId)
    if (!parent) return
    await taskDs.update(injector, parentId, {
      childTaskIds: [...parent.childTaskIds, childId],
    })
  })

  await pushEvent(parentId, { at: now, kind: 'spawned-child', childTaskId: childId, childType })
  emit(parentType, { kind: 'spawned-child', taskId: parentId, childTaskId: childId, at: now })
  telemetry.emit('onTaskSubmitted', {
    taskId: childId,
    type: childType,
    parentTaskId: parentId,
    payloadBytes: estimateSize(childPayload),
  })

  await queueAdapter.enqueue({ taskId: childId, type: childType, handlerVersion: 1, tags: tags ?? [] })
}

/**
 * Safety net for missed parent wakes: scans `waiting` parents and re-enqueues
 * any whose awaited children are all terminal. Runs on the core's reconciler
 * timer.
 */
export const reconcile = async (ops: CoreTaskOps): Promise<void> => {
  const { taskDs, injector, withTaskLock, queueAdapter, isDisposed } = ops
  if (isDisposed()) return

  const waiting = await taskDs.find(injector, { filter: { status: { $eq: 'waiting' } } })

  for (const task of waiting) {
    const awaited = parseAwaitedChildIds(task.resumeToken) ?? task.childTaskIds
    if (awaited.length === 0) continue
    const transitioned = await withTaskLock(task.id, async () => {
      const fresh = await taskDs.get(injector, task.id)
      if (!fresh || fresh.status !== 'waiting') return undefined
      if (!(await allChildrenTerminal(taskDs, injector, awaited))) return undefined
      await taskDs.update(injector, task.id, { status: 'pending', resumeToken: undefined })
      return fresh
    })
    if (transitioned) {
      await queueAdapter.enqueue({
        taskId: transitioned.id,
        type: transitioned.type,
        handlerVersion: transitioned.handlerVersion,
        tags: transitioned.tags,
      })
    }
  }
}
