import { defineStore, InMemoryStore } from '@furystack/core'
import { defineDataSet } from '@furystack/repository'
import { Task, TaskReplayLogEntry } from './types.js'

export const TaskStore = defineStore<Task, 'id'>({
  name: 'furystack/task-runner/TaskStore',
  model: Task,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: Task, primaryKey: 'id' }),
})

export const TaskReplayLogStore = defineStore<TaskReplayLogEntry, 'id'>({
  name: 'furystack/task-runner/TaskReplayLogStore',
  model: TaskReplayLogEntry,
  primaryKey: 'id',
  factory: () => new InMemoryStore({ model: TaskReplayLogEntry, primaryKey: 'id' }),
})

export const TaskDataSet = defineDataSet({
  name: 'furystack/task-runner/TaskDataSet',
  store: TaskStore,
})

export const TaskReplayLogDataSet = defineDataSet({
  name: 'furystack/task-runner/TaskReplayLogDataSet',
  store: TaskReplayLogStore,
})
