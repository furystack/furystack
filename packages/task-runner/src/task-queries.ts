import type { Injector } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import { isTerminalStatus } from './types.js'
import type { Task, TaskTreeNode } from './types.js'

/**
 * Read-only dataset queries over the Task store, factored out of
 * `TaskRunnerCore` so the lookups stay pure and independently testable.
 * None of them mutate state.
 */
type TaskReader = DataSet<Task, 'id'>

/** Finds the single task carrying `(idempotencyKey, type)`, if any. */
export const findByIdempotencyKey = async (
  taskDs: TaskReader,
  injector: Injector,
  key: string,
  type: string,
): Promise<Task | undefined> => {
  const results = await taskDs.find(injector, {
    filter: { idempotencyKey: { $eq: key }, type: { $eq: type } },
    top: 1,
  })
  return results[0]
}

/** Recursively materializes the DAG rooted at `task` into a {@link TaskTreeNode}. */
export const buildTree = async (taskDs: TaskReader, injector: Injector, task: Task): Promise<TaskTreeNode> => {
  const children: TaskTreeNode[] = []
  for (const cid of task.childTaskIds) {
    const child = await taskDs.get(injector, cid)
    if (child) children.push(await buildTree(taskDs, injector, child))
  }
  return { task, children }
}

/**
 * Walks the `parentTaskId` chain from `parentId` looking for `taskId`. Returns
 * `true` when adding `taskId` under `parentId` would close a cycle.
 */
export const detectCycle = async (
  taskDs: TaskReader,
  injector: Injector,
  taskId: string,
  parentId: string,
): Promise<boolean> => {
  let current: string | undefined = parentId
  const visited = new Set<string>()
  while (current) {
    if (current === taskId) return true
    if (visited.has(current)) return false
    visited.add(current)
    const parent: Task | undefined = await taskDs.get(injector, current)
    current = parent?.parentTaskId
  }
  return false
}

/** True only when every id resolves to a task that has reached a terminal status. */
export const allChildrenTerminal = async (taskDs: TaskReader, injector: Injector, ids: string[]): Promise<boolean> => {
  for (const id of ids) {
    const child = await taskDs.get(injector, id)
    if (!child || !isTerminalStatus(child.status)) return false
  }
  return true
}
