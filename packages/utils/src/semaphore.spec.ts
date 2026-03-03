import { describe, expect, it, vi } from 'vitest'
import { sleepAsync } from './sleep-async.js'
import { using } from './using.js'
import { Semaphore, SemaphoreDisposedError } from './semaphore.js'

export const semaphoreTests = describe('Semaphore', () => {
  it('should be constructed with a given concurrency limit', () => {
    using(new Semaphore(3), (s) => {
      expect(s).toBeInstanceOf(Semaphore)
      expect(s.getMaxConcurrent()).toBe(3)
      expect(s.pendingCount.getValue()).toBe(0)
      expect(s.runningCount.getValue()).toBe(0)
      expect(s.completedCount.getValue()).toBe(0)
      expect(s.failedCount.getValue()).toBe(0)
    })
  })

  it('should execute a single task and return its result', async () => {
    const s = new Semaphore(2)
    const result = await s.execute(async () => 42)
    expect(result).toBe(42)
    expect(s.completedCount.getValue()).toBe(1)
    expect(s.runningCount.getValue()).toBe(0)
    s[Symbol.dispose]()
  })

  it('should execute up to N tasks concurrently and queue the rest', async () => {
    const s = new Semaphore(2)
    const running: string[] = []
    const resolvers: Array<() => void> = []

    const createTask = (name: string) =>
      s.execute(async () => {
        running.push(name)
        await new Promise<void>((resolve) => resolvers.push(resolve))
        return name
      })

    const p1 = createTask('a')
    const p2 = createTask('b')
    const p3 = createTask('c')

    await sleepAsync(10)

    expect(running).toEqual(['a', 'b'])
    expect(s.runningCount.getValue()).toBe(2)
    expect(s.pendingCount.getValue()).toBe(1)

    resolvers[0]()
    await p1

    await sleepAsync(10)

    expect(running).toEqual(['a', 'b', 'c'])
    expect(s.runningCount.getValue()).toBe(2)
    expect(s.pendingCount.getValue()).toBe(0)

    resolvers[1]()
    resolvers[2]()
    await Promise.all([p2, p3])

    expect(s.completedCount.getValue()).toBe(3)
    expect(s.runningCount.getValue()).toBe(0)
    s[Symbol.dispose]()
  })

  it('should propagate task rejection to the caller and continue processing', async () => {
    const s = new Semaphore(1)
    const taskError = new Error('task failed')

    const p1 = s.execute(async () => {
      throw taskError
    })
    const p2 = s.execute(async () => 'ok')

    await expect(p1).rejects.toThrow('task failed')

    const result = await p2
    expect(result).toBe('ok')
    expect(s.failedCount.getValue()).toBe(1)
    expect(s.completedCount.getValue()).toBe(1)
    s[Symbol.dispose]()
  })

  describe('ObservableValue counters', () => {
    it('should update pendingCount and runningCount on transitions', async () => {
      const s = new Semaphore(1)
      const pendingChanges: number[] = []
      const runningChanges: number[] = []

      s.pendingCount.subscribe((v) => {
        pendingChanges.push(v)
      })
      s.runningCount.subscribe((v) => {
        runningChanges.push(v)
      })

      let resolve!: () => void
      const p1 = s.execute(async () => {
        await new Promise<void>((r) => (resolve = r))
      })

      const p2 = s.execute(async () => 'done')

      await sleepAsync(10)

      expect(pendingChanges).toContain(1)
      expect(runningChanges).toContain(1)

      resolve()
      await p1
      await sleepAsync(10)
      await p2

      expect(s.pendingCount.getValue()).toBe(0)
      expect(s.runningCount.getValue()).toBe(0)
      expect(s.completedCount.getValue()).toBe(2)
      s[Symbol.dispose]()
    })

    it('should update completedCount and failedCount correctly', async () => {
      const s = new Semaphore(2)

      await s.execute(async () => 'ok')
      await s
        .execute(async () => {
          throw new Error('fail')
        })
        .catch(() => {})

      expect(s.completedCount.getValue()).toBe(1)
      expect(s.failedCount.getValue()).toBe(1)
      s[Symbol.dispose]()
    })
  })

  describe('AbortSignal support', () => {
    it('should abort a pending task when the caller signal aborts', async () => {
      const s = new Semaphore(1)
      let resolve!: () => void

      const p1 = s.execute(async () => {
        await new Promise<void>((r) => (resolve = r))
      })

      const controller = new AbortController()
      const p2 = s.execute(async () => 'should not run', { signal: controller.signal })

      await sleepAsync(10)
      expect(s.pendingCount.getValue()).toBe(1)

      controller.abort(new Error('cancelled'))
      await expect(p2).rejects.toThrow('cancelled')
      expect(s.pendingCount.getValue()).toBe(0)

      resolve()
      await p1
      s[Symbol.dispose]()
    })

    it('should reject immediately if the caller signal is already aborted', async () => {
      const s = new Semaphore(1)
      const controller = new AbortController()
      controller.abort(new Error('pre-aborted'))

      await expect(s.execute(async () => 'should not run', { signal: controller.signal })).rejects.toThrow(
        'pre-aborted',
      )

      expect(s.pendingCount.getValue()).toBe(0)
      expect(s.runningCount.getValue()).toBe(0)
      s[Symbol.dispose]()
    })

    it('should abort the signal passed to a running task when the caller signal aborts', async () => {
      const s = new Semaphore(1)
      const signalAborted = vi.fn()

      const controller = new AbortController()
      const p = s.execute(
        async ({ signal }) => {
          signal.addEventListener('abort', signalAborted)
          await new Promise<void>((resolve) => {
            signal.addEventListener('abort', () => resolve())
          })
          throw signal.reason
        },
        { signal: controller.signal },
      )

      await sleepAsync(10)
      expect(s.runningCount.getValue()).toBe(1)

      controller.abort(new Error('stop'))
      await expect(p).rejects.toThrow('stop')
      expect(signalAborted).toBeCalledTimes(1)
      s[Symbol.dispose]()
    })
  })

  describe('EventHub events', () => {
    it('should emit taskStarted when a task begins running', async () => {
      const s = new Semaphore(1)
      const listener = vi.fn()
      s.subscribe('taskStarted', listener)

      await s.execute(async () => 'done')

      expect(listener).toBeCalledTimes(1)
      s[Symbol.dispose]()
    })

    it('should emit taskCompleted when a task resolves', async () => {
      const s = new Semaphore(1)
      const listener = vi.fn()
      s.subscribe('taskCompleted', listener)

      await s.execute(async () => 'done')

      expect(listener).toBeCalledTimes(1)
      s[Symbol.dispose]()
    })

    it('should emit taskFailed with the error when a task rejects', async () => {
      const s = new Semaphore(1)
      const listener = vi.fn()
      s.subscribe('taskFailed', listener)

      const taskError = new Error('boom')
      await s
        .execute(async () => {
          throw taskError
        })
        .catch(() => {})

      expect(listener).toBeCalledTimes(1)
      expect(listener).toBeCalledWith({ error: taskError })
      s[Symbol.dispose]()
    })

    it('should emit events in correct order for queued tasks', async () => {
      const s = new Semaphore(1)
      const events: string[] = []

      s.subscribe('taskStarted', () => {
        events.push('started')
      })
      s.subscribe('taskCompleted', () => {
        events.push('completed')
      })

      await Promise.all([s.execute(async () => 'a'), s.execute(async () => 'b')])

      await sleepAsync(10)

      expect(events).toEqual(['started', 'completed', 'started', 'completed'])
      s[Symbol.dispose]()
    })
  })

  describe('setMaxConcurrent', () => {
    it('should return the updated value from getMaxConcurrent', () => {
      const s = new Semaphore(2)
      s.setMaxConcurrent(5)
      expect(s.getMaxConcurrent()).toBe(5)
      s[Symbol.dispose]()
    })

    it('should throw when given a non-positive integer', () => {
      const s = new Semaphore(2)
      expect(() => s.setMaxConcurrent(0)).toThrow('maxConcurrent must be a positive integer')
      expect(() => s.setMaxConcurrent(-1)).toThrow('maxConcurrent must be a positive integer')
      expect(() => s.setMaxConcurrent(1.5)).toThrow('maxConcurrent must be a positive integer')
      s[Symbol.dispose]()
    })

    it('should immediately start queued tasks when increased', async () => {
      const s = new Semaphore(1)
      const running: string[] = []
      const resolvers: Array<() => void> = []

      const createTask = (name: string) =>
        s.execute(async () => {
          running.push(name)
          await new Promise<void>((resolve) => resolvers.push(resolve))
          return name
        })

      const p1 = createTask('a')
      const p2 = createTask('b')
      const p3 = createTask('c')

      await sleepAsync(10)
      expect(running).toEqual(['a'])
      expect(s.runningCount.getValue()).toBe(1)
      expect(s.pendingCount.getValue()).toBe(2)

      s.setMaxConcurrent(3)

      await sleepAsync(10)
      expect(running).toEqual(['a', 'b', 'c'])
      expect(s.runningCount.getValue()).toBe(3)
      expect(s.pendingCount.getValue()).toBe(0)

      resolvers.forEach((r) => r())
      await Promise.all([p1, p2, p3])
      s[Symbol.dispose]()
    })

    it('should not abort running tasks when decreased', async () => {
      const s = new Semaphore(3)
      const resolvers: Array<() => void> = []

      const createTask = () =>
        s.execute(async () => {
          await new Promise<void>((resolve) => resolvers.push(resolve))
        })

      const p1 = createTask()
      const p2 = createTask()
      const p3 = createTask()

      await sleepAsync(10)
      expect(s.runningCount.getValue()).toBe(3)

      s.setMaxConcurrent(1)

      expect(s.runningCount.getValue()).toBe(3)

      resolvers.forEach((r) => r())
      await Promise.all([p1, p2, p3])
      expect(s.completedCount.getValue()).toBe(3)
      s[Symbol.dispose]()
    })

    it('should not start new tasks until running count drops below new lower limit', async () => {
      const s = new Semaphore(2)
      const running: string[] = []
      const resolvers: Array<() => void> = []

      const createTask = (name: string) =>
        s.execute(async () => {
          running.push(name)
          await new Promise<void>((resolve) => resolvers.push(resolve))
          return name
        })

      const p1 = createTask('a')
      const p2 = createTask('b')
      const p3 = createTask('c')

      await sleepAsync(10)
      expect(running).toEqual(['a', 'b'])
      expect(s.pendingCount.getValue()).toBe(1)

      s.setMaxConcurrent(1)

      resolvers[0]()
      await p1
      await sleepAsync(10)

      expect(running).toEqual(['a', 'b'])
      expect(s.pendingCount.getValue()).toBe(1)

      resolvers[1]()
      await p2
      await sleepAsync(10)

      expect(running).toEqual(['a', 'b', 'c'])
      expect(s.pendingCount.getValue()).toBe(0)

      resolvers[2]()
      await p3
      s[Symbol.dispose]()
    })
  })

  describe('Disposal', () => {
    it('should reject all pending tasks with SemaphoreDisposedError', async () => {
      const s = new Semaphore(1)
      let resolve!: () => void

      const p1 = s.execute(async () => {
        await new Promise<void>((r) => (resolve = r))
      })

      const p2 = s.execute(async () => 'pending1')
      const p3 = s.execute(async () => 'pending2')

      await sleepAsync(10)
      expect(s.pendingCount.getValue()).toBe(2)

      s[Symbol.dispose]()

      await expect(p2).rejects.toThrow('Semaphore already disposed')
      await expect(p3).rejects.toThrow('Semaphore already disposed')
      await expect(p2).rejects.toBeInstanceOf(SemaphoreDisposedError)
      await expect(p3).rejects.toBeInstanceOf(SemaphoreDisposedError)

      resolve()
      await p1
    })

    it('should abort signals of running tasks on disposal', async () => {
      const s = new Semaphore(1)
      const signalAborted = vi.fn()

      const p = s.execute(async ({ signal }) => {
        signal.addEventListener('abort', signalAborted)
        await new Promise<void>((resolve) => {
          signal.addEventListener('abort', () => resolve())
        })
        throw signal.reason
      })

      await sleepAsync(10)
      expect(s.runningCount.getValue()).toBe(1)

      s[Symbol.dispose]()

      await expect(p).rejects.toBeInstanceOf(SemaphoreDisposedError)
      expect(signalAborted).toBeCalledTimes(1)
    })

    it('should throw SemaphoreDisposedError when calling execute() after disposal', () => {
      const s = new Semaphore(1)
      s[Symbol.dispose]()

      expect(() => s.execute(async () => 'too late')).toThrow('Semaphore already disposed')
      expect(() => s.execute(async () => 'too late')).toThrow(SemaphoreDisposedError)
    })

    it('should dispose all ObservableValues', () => {
      const s = new Semaphore(1)
      s[Symbol.dispose]()

      expect(s.pendingCount.isDisposed).toBe(true)
      expect(s.runningCount.isDisposed).toBe(true)
      expect(s.completedCount.isDisposed).toBe(true)
      expect(s.failedCount.isDisposed).toBe(true)
    })

    it('should clear event listeners via super', () => {
      const s = new Semaphore(1)
      const listener = vi.fn()
      s.subscribe('taskStarted', listener)

      s[Symbol.dispose]()

      s.emit('taskStarted', undefined)
      expect(listener).not.toBeCalled()
    })
  })
})
