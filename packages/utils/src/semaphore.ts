import { EventHub, type ListenerErrorPayload } from './event-hub.js'
import { ObservableValue } from './observable-value.js'

/**
 * Thrown by {@link Semaphore.execute} on a disposed semaphore, and used as
 * the rejection reason for pending tasks when the semaphore is disposed.
 */
export class SemaphoreDisposedError extends Error {
  constructor() {
    super('Semaphore already disposed')
  }
}

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
  private readonly queue: Array<QueuedTask<any>> = []
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

  constructor(maxConcurrent: number) {
    super()
    this._maxConcurrent = maxConcurrent
  }

  public getMaxConcurrent(): number {
    return this._maxConcurrent
  }

  /**
   * Updates the concurrency limit. Raising it drains queued tasks into the
   * new slots immediately. Lowering it leaves running tasks alone — new
   * tasks queue until running count drops below the new limit. Throws on
   * non-positive integers.
   */
  public setMaxConcurrent(value: number): void {
    if (!Number.isInteger(value) || value < 1) {
      throw new Error('maxConcurrent must be a positive integer')
    }
    this._maxConcurrent = value
    this.drain()
  }

  /**
   * Queues `task` for execution. The task receives an `AbortSignal` that
   * aborts when the caller's signal aborts (if provided) or when the
   * semaphore is disposed. Returns a promise resolving/rejecting with the
   * task's own result. Throws {@link SemaphoreDisposedError} synchronously
   * when called on a disposed semaphore.
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

      const entry: QueuedTask<T> = { task, resolve, reject, abortController }

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

  private removePending<T>(entry: QueuedTask<T>): void {
    const idx = this.queue.indexOf(entry)
    if (idx !== -1) {
      this.queue.splice(idx, 1)
      this.pendingCount.setValue(this.pendingCount.getValue() - 1)
      entry.reject(entry.abortController.signal.reason)
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
