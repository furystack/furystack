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
  /**
   * Identity that submitted the task. Populated by the REST surface from
   * `IdentityContext.getCurrentUser()`; server-internal callers leave it
   * unset.
   */
  submittedBy?: string
}

/**
 * Options accepted by {@link TaskRunner.start}. When `payload` is supplied
 * the draft's payload is replaced wholesale before the task is released to
 * the queue. Used by the two-phase submit flow: the REST layer creates a
 * draft, returns presigned upload URLs, then `start`s the task once the
 * client has finished uploading and substituted the resolved blob keys
 * into the payload.
 */
export type StartOptions<TPayload = unknown> = {
  payload?: TPayload
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
  /** Submit a new task. Creates the row and immediately enqueues it for dispatch. */
  submit<TPayload = unknown>(args: SubmitOptions<TPayload>): Promise<Task>
  /**
   * Create a task in `'draft'` status without enqueueing. Returned task is
   * invisible to workers until {@link TaskRunner.start} flips it to
   * `'pending'`. Used by the REST surface to mint presigned upload URLs
   * before the task is dispatched.
   */
  draft<TPayload = unknown>(args: SubmitOptions<TPayload>): Promise<Task>
  /**
   * Release a draft task to the queue. Optionally replaces the draft's
   * payload (e.g. with one carrying resolved blob keys after upload).
   * Throws when the task is not in `'draft'` status.
   */
  start<TPayload = unknown>(taskId: string, opts?: StartOptions<TPayload>): Promise<Task>
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
