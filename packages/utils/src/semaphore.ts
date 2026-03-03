import { EventHub, type ListenerErrorPayload } from './event-hub.js'
import { ObservableValue } from './observable-value.js'

/**
 * Error thrown when you try to execute on a semaphore that is already disposed,
 * or when pending tasks are rejected due to disposal.
 */
export class SemaphoreDisposedError extends Error {
  constructor() {
    super('Semaphore already disposed')
  }
}

/**
 * Event map for the Semaphore's EventHub.
 */
export type SemaphoreEvents = {
  /** Fired when a queued task begins execution */
  taskStarted: undefined
  /** Fired when a running task resolves successfully */
  taskCompleted: undefined
  /** Fired when a running task rejects, carrying the thrown error */
  taskFailed: { error: unknown }
  /** Fired when an event listener throws during emission */
  onListenerError: ListenerErrorPayload
}

type QueuedTask<T = unknown> = {
  task: (options: { signal: AbortSignal }) => Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
  abortController: AbortController
  callerSignal?: AbortSignal
  callerAbortHandler?: () => void
}

/**
 * An async semaphore that limits concurrent task execution to a fixed number of slots.
 *
 * Extends {@link EventHub} with {@link SemaphoreEvents} for per-task lifecycle events
 * (`taskStarted`, `taskCompleted`, `taskFailed`).
 *
 * Exposes individual {@link ObservableValue} counters for reactive state monitoring.
 *
 * @example
 * ```ts
 * const results = await usingAsync(new Semaphore(3), async (semaphore) => {
 *   semaphore.pendingCount.subscribe((count) => console.log('Pending:', count))
 *   semaphore.subscribe('taskCompleted', () => console.log('A task completed'))
 *
 *   return await Promise.all(
 *     urls.map((url) => semaphore.execute(({ signal }) => fetch(url, { signal }))),
 *   )
 * })
 * ```
 */
export class Semaphore extends EventHub<SemaphoreEvents> {
  private readonly queue: QueuedTask[] = []
  private readonly running = new Set<QueuedTask>()
  private disposed = false

  /** The number of tasks waiting in the queue to be started */
  public readonly pendingCount = new ObservableValue<number>(0)
  /** The number of tasks currently executing */
  public readonly runningCount = new ObservableValue<number>(0)
  /** The total number of tasks that have resolved successfully */
  public readonly completedCount = new ObservableValue<number>(0)
  /** The total number of tasks that have rejected */
  public readonly failedCount = new ObservableValue<number>(0)

  private _maxConcurrent: number

  /**
   * @param maxConcurrent The maximum number of tasks that can run concurrently
   */
  constructor(maxConcurrent: number) {
    super()
    this._maxConcurrent = maxConcurrent
  }

  /**
   * Returns the current maximum number of tasks that can run concurrently.
   * @returns The current concurrency limit
   */
  public getMaxConcurrent(): number {
    return this._maxConcurrent
  }

  /**
   * Updates the maximum number of tasks that can run concurrently.
   *
   * If the new limit is higher than the current one, queued tasks will
   * be started immediately to fill the new slots.
   * If the new limit is lower, already-running tasks will not be aborted,
   * but no new tasks will start until the running count drops below the new limit.
   *
   * @param value The new concurrency limit (must be a positive integer)
   */
  public setMaxConcurrent(value: number): void {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error('maxConcurrent must be a positive integer')
    }
    this._maxConcurrent = value
    this.drain()
  }

  /**
   * Queues a task for execution. Resolves or rejects with the task's own result.
   *
   * The task function receives an `AbortSignal` that is aborted when:
   * - the caller's signal aborts (if provided via `options.signal`)
   * - the semaphore is disposed
   *
   * @param task The async function to execute
   * @param options Optional configuration including an AbortSignal
   * @returns A promise that resolves/rejects with the task's result
   */
  public execute<T>(
    task: (options: { signal: AbortSignal }) => Promise<T>,
    options?: { signal?: AbortSignal },
  ): Promise<T> {
    if (this.disposed) {
      throw new SemaphoreDisposedError()
    }

    if (options?.signal?.aborted) {
      return Promise.reject(options.signal.reason as Error)
    }

    return new Promise<T>((resolve, reject) => {
      const abortController = new AbortController()

      const entry = { task, resolve, reject, abortController } as unknown as QueuedTask

      if (options?.signal) {
        const callerAbortHandler = () => {
          abortController.abort(options.signal!.reason)
          this.removePending(entry)
        }
        entry.callerSignal = options.signal
        entry.callerAbortHandler = callerAbortHandler
        options.signal.addEventListener('abort', callerAbortHandler, { once: true })
      }

      this.queue.push(entry)
      this.pendingCount.setValue(this.pendingCount.getValue() + 1)

      this.drain()
    })
  }

  private removePending(entry: QueuedTask): void {
    const idx = this.queue.indexOf(entry)
    if (idx !== -1) {
      this.queue.splice(idx, 1)
      this.pendingCount.setValue(this.pendingCount.getValue() - 1)
      entry.reject(entry.abortController.signal.reason as unknown)
    }
  }

  private drain(): void {
    while (this.running.size < this._maxConcurrent && this.queue.length > 0) {
      const entry = this.queue.shift()!
      this.pendingCount.setValue(this.pendingCount.getValue() - 1)
      this.startTask(entry)
    }
  }

  private cleanupCallerSignal(entry: QueuedTask): void {
    if (entry.callerSignal && entry.callerAbortHandler) {
      entry.callerSignal.removeEventListener('abort', entry.callerAbortHandler)
      entry.callerSignal = undefined
      entry.callerAbortHandler = undefined
    }
  }

  private startTask(entry: QueuedTask): void {
    this.running.add(entry)
    this.runningCount.setValue(this.runningCount.getValue() + 1)
    this.emit('taskStarted', undefined)

    entry
      .task({ signal: entry.abortController.signal })
      .then(
        (value) => {
          this.running.delete(entry)
          this.cleanupCallerSignal(entry)
          if (!this.disposed) {
            this.runningCount.setValue(this.runningCount.getValue() - 1)
            this.completedCount.setValue(this.completedCount.getValue() + 1)
            this.emit('taskCompleted', undefined)
          }
          entry.resolve(value)
        },
        (error: unknown) => {
          this.running.delete(entry)
          this.cleanupCallerSignal(entry)
          if (!this.disposed) {
            this.runningCount.setValue(this.runningCount.getValue() - 1)
            this.failedCount.setValue(this.failedCount.getValue() + 1)
            this.emit('taskFailed', { error })
          }
          entry.reject(error)
        },
      )
      .finally(() => {
        if (!this.disposed) {
          this.drain()
        }
      })
  }

  /**
   * Disposes the semaphore: rejects all pending tasks with {@link SemaphoreDisposedError},
   * aborts the signal of every running task, and disposes all observable counters and event listeners.
   */
  public override [Symbol.dispose](): void {
    this.disposed = true

    for (const entry of [...this.queue]) {
      this.queue.shift()
      entry.reject(new SemaphoreDisposedError())
    }
    this.pendingCount.setValue(0)

    for (const entry of this.running) {
      entry.abortController.abort(new SemaphoreDisposedError())
    }

    this.pendingCount[Symbol.dispose]()
    this.runningCount[Symbol.dispose]()
    this.completedCount[Symbol.dispose]()
    this.failedCount[Symbol.dispose]()

    super[Symbol.dispose]()
  }
}
