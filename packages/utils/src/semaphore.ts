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
  taskStarted: undefined
  taskCompleted: undefined
  taskFailed: { error: unknown }
  onListenerError: ListenerErrorPayload
}

type QueuedTask<T = unknown> = {
  task: (options: { signal: AbortSignal }) => Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
  abortController: AbortController
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
 * const semaphore = new Semaphore(3)
 *
 * semaphore.pendingCount.subscribe((count) => console.log('Pending:', count))
 * semaphore.subscribe('taskCompleted', () => console.log('A task completed'))
 *
 * const results = await Promise.all(
 *   urls.map((url) => semaphore.execute(({ signal }) => fetch(url, { signal }))),
 * )
 *
 * semaphore[Symbol.dispose]()
 * ```
 */
export class Semaphore extends EventHub<SemaphoreEvents> {
  private readonly queue: QueuedTask[] = []
  private readonly running = new Set<QueuedTask>()
  private disposed = false

  public readonly pendingCount = new ObservableValue<number>(0)
  public readonly runningCount = new ObservableValue<number>(0)
  public readonly completedCount = new ObservableValue<number>(0)
  public readonly failedCount = new ObservableValue<number>(0)

  /**
   * @param maxConcurrent The maximum number of tasks that can run concurrently
   */
  constructor(private readonly maxConcurrent: number) {
    super()
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
        options.signal.addEventListener(
          'abort',
          () => {
            abortController.abort(options.signal!.reason)
            this.removePending(entry)
          },
          { once: true },
        )
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
    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const entry = this.queue.shift()!
      this.pendingCount.setValue(this.pendingCount.getValue() - 1)
      this.startTask(entry)
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
          if (!this.disposed) {
            this.runningCount.setValue(this.runningCount.getValue() - 1)
            this.completedCount.setValue(this.completedCount.getValue() + 1)
            this.emit('taskCompleted', undefined)
          }
          entry.resolve(value)
        },
        (error: unknown) => {
          this.running.delete(entry)
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
