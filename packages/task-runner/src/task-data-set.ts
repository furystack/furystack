import { defineStore, InMemoryStore } from '@furystack/core'
import { defineDataSet } from '@furystack/repository'
import { Task, TaskReplayLogEntry } from './types.js'

/**
 * Physical store for the task control-plane row. Defaults to an in-memory
 * store; bind any `defineStore` adapter (mongodb / redis / sequelize / …)
 * to persist tasks the same way the app persists every other entity.
 */
export const TaskStore = defineStore<Task, 'id'>({
  name: 'furystack/task-runner/TaskStore',
  model: Task,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: Task, primaryKey: 'id' }),
})

/**
 * Physical store for replay-log steps, kept separate from {@link TaskStore}
 * so a long-running parent's step log never bloats the small control-plane
 * row. Defaults to in-memory; bind any adapter for persistence.
 */
export const TaskReplayLogStore = defineStore<TaskReplayLogEntry, 'id'>({
  name: 'furystack/task-runner/TaskReplayLogStore',
  model: TaskReplayLogEntry,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: TaskReplayLogEntry, primaryKey: 'id' }),
})

/** Write gateway over {@link TaskStore}. The runner reads/writes task state exclusively through this. */
export const TaskDataSet = defineDataSet({
  name: 'furystack/task-runner/TaskDataSet',
  store: TaskStore,
})

/** Write gateway over {@link TaskReplayLogStore}, keyed `${taskId}:${stepIndex}` for crash-safe dedup. */
export const TaskReplayLogDataSet = defineDataSet({
  name: 'furystack/task-runner/TaskReplayLogDataSet',
  store: TaskReplayLogStore,
})
