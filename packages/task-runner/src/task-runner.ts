import { defineService, type Token } from '@furystack/inject'
import type { AnyTaskHandlerDescriptor } from './define-task-handler.js'
import type { Task, TaskRetentionPolicy, TaskTreeNode, TaskUpdate } from './types.js'

export type TaskRunnerCapabilities = {
  readonly persistent: boolean
  readonly fleetCapEnforcement: boolean
  readonly delayedDispatch: boolean
  readonly maxPayloadBytes: number
}

export type SubmitOptions<TPayload> = {
  type: string
  payload: TPayload
  handlerVersion: number
  idempotencyKey?: string
  notBefore?: Date
  tags?: string[]
  parentTaskId?: string
  retentionPolicy?: Partial<TaskRetentionPolicy>
}

export type RegisterWorkerOptions = {
  name: string
  handlers: AnyTaskHandlerDescriptor[]
  concurrency: number
  tags: string[]
  compatibleVersions: Record<string, number[]>
}

/**
 * Runtime state of a registered worker. Exposed as the DI-resolved value
 * of a worker token so callers can inspect active task counts or trigger
 * drain.
 */
export type Worker = Disposable & {
  readonly name: string
  readonly workerId: string
  readonly concurrency: number
  readonly tags: string[]
  readonly activeTaskCount: number
  drain(opts?: { timeoutMs?: number }): Promise<void>
}

/**
 * Public API surface for submitting, querying, cancelling, and subscribing
 * to distributed tasks. Implementations back the lifecycle with a transport-
 * specific queue (in-process, Redis Streams, ...).
 *
 * Bind a concrete implementation via `injector.bind(TaskRunner, defineInProcessTaskRunner())`.
 */
export type TaskRunner = Disposable & {
  submit<TPayload = unknown>(args: SubmitOptions<TPayload>): Promise<Task>
  cancel(taskId: string, reason?: string): Promise<void>
  get(taskId: string): Promise<Task | undefined>
  getTree(taskId: string): Promise<TaskTreeNode>
  subscribe(taskId: string, handler: (event: TaskUpdate) => void): Disposable
  subscribeByType(type: string, handler: (event: TaskUpdate) => void): Disposable
  registerWorker(options: RegisterWorkerOptions): Worker
  readonly capabilities: TaskRunnerCapabilities
}

/**
 * Shared {@link TaskRunner} token. The default factory throws — bind a
 * concrete implementation (e.g. `defineInProcessTaskRunner()`) before any
 * worker registration. The same applies to `defineWorker`-produced tokens,
 * which inject this token at resolution time.
 */
export const TaskRunner: Token<TaskRunner, 'singleton'> = defineService({
  name: 'furystack/task-runner/TaskRunner',
  lifetime: 'singleton',
  factory: () => {
    throw new Error(
      'TaskRunner is not configured. Bind a concrete implementation, e.g.:\n' +
        '  injector.bind(TaskRunner, defineInProcessTaskRunner())\n' +
        'This is required before resolving any defineWorker(...) token.',
    )
  },
})
