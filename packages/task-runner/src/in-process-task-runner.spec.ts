import { describe, it, expect, afterEach } from 'vitest'
import { defineTaskHandler } from './define-task-handler.js'
import { createTestRunner } from './testing/create-test-runner.js'
import { runTaskToCompletion } from './testing/run-task-to-completion.js'
import type { TestRunner } from './testing/create-test-runner.js'

const echoHandler = defineTaskHandler<{ value: string }, { echoed: string }>({
  type: 'echo',
  version: 1,
  handler: async (_ctx, payload) => ({ echoed: payload.value }),
})

const failingHandler = defineTaskHandler<{ message: string }, never>({
  type: 'fail',
  version: 1,
  retryPolicy: { maxAttempts: 1, backoff: 'none', baseDelayMs: 0, jitter: 0 },
  handler: async (_ctx, payload) => {
    throw new Error(payload.message)
  },
})

const retryHandler = defineTaskHandler<{ failUntilAttempt: number }, { attempt: number }>({
  type: 'retry-me',
  version: 1,
  retryPolicy: { maxAttempts: 3, backoff: 'none', baseDelayMs: 0, jitter: 0 },
  handler: async (ctx, payload) => {
    if (ctx.attempt < payload.failUntilAttempt) {
      throw new Error(`attempt ${ctx.attempt} failed`)
    }
    return { attempt: ctx.attempt }
  },
})

const parentHandler = defineTaskHandler<{ childPayloads: string[] }, { childResults: string[] }>({
  type: 'parent',
  version: 1,
  handler: async (ctx, payload) => {
    const handles = await Promise.all(
      payload.childPayloads.map((v) => ctx.spawnChild<{ value: string }, { echoed: string }>('echo', { value: v })),
    )
    const results = await ctx.awaitChildren(handles)
    return { childResults: results.map((r) => r.echoed) }
  },
})

const progressHandler = defineTaskHandler<Record<string, never>, void>({
  type: 'progress-reporter',
  version: 1,
  progressThrottleMs: 0,
  handler: async (ctx) => {
    ctx.reportProgress({ percent: 25 })
    ctx.reportProgress({ percent: 50 })
    ctx.reportProgress({ percent: 100 })
  },
})

const deterministicHandler = defineTaskHandler<Record<string, never>, { time: string; rand: number }>({
  type: 'deterministic',
  version: 1,
  handler: async (ctx) => {
    const time = ctx.now()
    const rand = ctx.random()
    return { time: time.toISOString(), rand }
  },
})

let tr: TestRunner

afterEach(async () => {
  if (tr) await tr[Symbol.asyncDispose]()
})

describe('InProcessTaskRunner', () => {
  describe('submit + execute', () => {
    it('submits and runs a task to succeeded', async () => {
      tr = createTestRunner({ handlers: [echoHandler] })
      const task = await tr.runner.submit({ type: 'echo', payload: { value: 'hello' }, handlerVersion: 1 })
      expect(task.status).toBe('pending')

      const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      expect(completed.status).toBe('succeeded')
      expect(completed.result).toEqual({ echoed: 'hello' })
    })

    it('runs a failing task to failed', async () => {
      tr = createTestRunner({ handlers: [failingHandler] })
      const task = await tr.runner.submit({ type: 'fail', payload: { message: 'boom' }, handlerVersion: 1 })

      const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      expect(completed.status).toBe('failed')
      expect(completed.error?.message).toBe('boom')
    })
  })

  describe('retry', () => {
    it('retries and eventually succeeds', async () => {
      tr = createTestRunner({ handlers: [retryHandler] })
      const task = await tr.runner.submit({
        type: 'retry-me',
        payload: { failUntilAttempt: 2 },
        handlerVersion: 1,
      })

      const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      expect(completed.status).toBe('succeeded')
      expect(completed.result).toEqual({ attempt: 2 })
      expect(completed.attempts.length).toBe(2)
    })

    it('exhausts retries and fails', async () => {
      tr = createTestRunner({ handlers: [retryHandler] })
      const task = await tr.runner.submit({
        type: 'retry-me',
        payload: { failUntilAttempt: 99 },
        handlerVersion: 1,
      })

      const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      expect(completed.status).toBe('failed')
      expect(completed.attempts.length).toBe(3)
    })
  })

  describe('DAG', () => {
    it('parent spawns children, awaits, and collects results', async () => {
      tr = createTestRunner({ handlers: [echoHandler, parentHandler] })
      const task = await tr.runner.submit({
        type: 'parent',
        payload: { childPayloads: ['a', 'b', 'c'] },
        handlerVersion: 1,
      })

      const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })
      expect(completed.status).toBe('succeeded')
      expect(completed.result).toEqual({ childResults: ['a', 'b', 'c'] })
    })

    it('getTree returns the full DAG', async () => {
      tr = createTestRunner({ handlers: [echoHandler, parentHandler] })
      const task = await tr.runner.submit({
        type: 'parent',
        payload: { childPayloads: ['x'] },
        handlerVersion: 1,
      })

      await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })
      const tree = await tr.runner.getTree(task.id)
      expect(tree.task.id).toBe(task.id)
      expect(tree.children.length).toBe(1)
      expect(tree.children[0].task.type).toBe('echo')
    })
  })

  describe('cancellation', () => {
    it('cancels a pending task', async () => {
      tr = createTestRunner({ handlers: [] })
      const task = await tr.runner.submit({ type: 'echo', payload: { value: 'x' }, handlerVersion: 1 })
      await tr.runner.cancel(task.id)

      const result = await tr.runner.get(task.id)
      expect(result?.status).toBe('cancelled')
    })

    it('cancels a running task via abort signal', async () => {
      const longHandler = defineTaskHandler<Record<string, never>, void>({
        type: 'long',
        version: 1,
        handler: async (ctx) => {
          await ctx.sleep(60_000)
        },
      })

      tr = createTestRunner({ handlers: [longHandler] })
      const task = await tr.runner.submit({ type: 'long', payload: {}, handlerVersion: 1 })

      await new Promise<void>((r) => setTimeout(r, 50))
      await tr.runner.cancel(task.id)

      const result = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 2000 })
      expect(result.status).toBe('cancelled')
    })
  })

  describe('subscribe', () => {
    it('receives status updates for a specific task', async () => {
      tr = createTestRunner({ handlers: [echoHandler] })

      const updates: string[] = []
      const task = await tr.runner.submit({ type: 'echo', payload: { value: 'sub' }, handlerVersion: 1 })
      using _sub = tr.runner.subscribe(task.id, (e) => {
        if (e.kind === 'status') updates.push(e.status)
      })

      await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      expect(updates).toContain('succeeded')
    })

    it('receives updates by type', async () => {
      tr = createTestRunner({ handlers: [echoHandler] })

      const updates: string[] = []
      using _sub = tr.runner.subscribeByType('echo', (e) => {
        if (e.kind === 'status') updates.push(e.status)
      })

      const task = await tr.runner.submit({ type: 'echo', payload: { value: 'typed' }, handlerVersion: 1 })
      await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      expect(updates).toContain('succeeded')
    })
  })

  describe('progress', () => {
    it('reports progress updates', async () => {
      tr = createTestRunner({ handlers: [progressHandler] })

      const percents: number[] = []
      const task = await tr.runner.submit({ type: 'progress-reporter', payload: {}, handlerVersion: 1 })
      using _sub = tr.runner.subscribe(task.id, (e) => {
        if (e.kind === 'progress') percents.push(e.percent)
      })

      await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      expect(percents).toContain(100)
    })
  })

  describe('determinism helpers', () => {
    it('ctx.now() and ctx.random() return values', async () => {
      tr = createTestRunner({ handlers: [deterministicHandler] })
      const task = await tr.runner.submit({ type: 'deterministic', payload: {}, handlerVersion: 1 })

      const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      expect(completed.status).toBe('succeeded')
      const result = completed.result as { time: string; rand: number }
      expect(new Date(result.time).getTime()).toBeGreaterThan(0)
      expect(result.rand).toBeGreaterThanOrEqual(0)
      expect(result.rand).toBeLessThan(1)
    })
  })

  describe('idempotency', () => {
    it('deduplicates by idempotency key', async () => {
      tr = createTestRunner({ handlers: [echoHandler] })
      const a = await tr.runner.submit({
        type: 'echo',
        payload: { value: 'first' },
        handlerVersion: 1,
        idempotencyKey: 'dedup-1',
      })
      const b = await tr.runner.submit({
        type: 'echo',
        payload: { value: 'second' },
        handlerVersion: 1,
        idempotencyKey: 'dedup-1',
      })
      expect(a.id).toBe(b.id)
    })
  })

  describe('worker registration', () => {
    it('respects concurrency limit', async () => {
      const slowHandler = defineTaskHandler<Record<string, never>, void>({
        type: 'slow',
        version: 1,
        handler: async (ctx) => {
          await ctx.sleep(200)
        },
      })

      tr = createTestRunner({ handlers: [slowHandler], workerConcurrency: 1 })

      const t1 = await tr.runner.submit({ type: 'slow', payload: {}, handlerVersion: 1 })
      const t2 = await tr.runner.submit({ type: 'slow', payload: {}, handlerVersion: 1 })

      await new Promise<void>((r) => setTimeout(r, 50))
      expect(tr.worker?.activeTaskCount).toBeLessThanOrEqual(1)

      await runTaskToCompletion({ runner: tr.runner, taskId: t1.id, timeoutMs: 5000 })
      await runTaskToCompletion({ runner: tr.runner, taskId: t2.id, timeoutMs: 5000 })
    })

    it('drain waits for active tasks', async () => {
      const slowHandler = defineTaskHandler<Record<string, never>, void>({
        type: 'slow-drain',
        version: 1,
        handler: async (ctx) => {
          await ctx.sleep(100)
        },
      })

      tr = createTestRunner({ handlers: [slowHandler] })
      await tr.runner.submit({ type: 'slow-drain', payload: {}, handlerVersion: 1 })
      await new Promise<void>((r) => setTimeout(r, 20))

      await tr.worker!.drain({ timeoutMs: 5000 })
    })

    it('re-enqueues task whose handlerVersion is incompatible with the picked worker', async () => {
      const v1Handler = defineTaskHandler<Record<string, never>, { v: number }>({
        type: 'versioned',
        version: 1,
        handler: async () => ({ v: 1 }),
      })

      tr = createTestRunner({ handlers: [v1Handler], compatibleVersions: { versioned: [2] } })

      const task = await tr.runner.submit({ type: 'versioned', payload: {}, handlerVersion: 1 })
      await new Promise<void>((r) => setTimeout(r, 80))
      const after = await tr.runner.get(task.id)
      expect(after?.status).toBe('pending')
    })
  })

  describe('multi-child DAG', () => {
    it('persists every child id on parent.childTaskIds (no race)', async () => {
      tr = createTestRunner({ handlers: [echoHandler, parentHandler] })
      const task = await tr.runner.submit({
        type: 'parent',
        payload: { childPayloads: ['a', 'b', 'c', 'd', 'e'] },
        handlerVersion: 1,
      })

      await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })
      const tree = await tr.runner.getTree(task.id)
      expect(tree.children.length).toBe(5)
      const echoes = tree.children.map((c) => c.task.type)
      expect(echoes.every((t) => t === 'echo')).toBe(true)
    })

    it('cascade-cancels every child', async () => {
      const longChild = defineTaskHandler<Record<string, never>, void>({
        type: 'long-child',
        version: 1,
        handler: async (ctx) => {
          await ctx.sleep(60_000)
        },
      })
      const fanOut = defineTaskHandler<Record<string, never>, void>({
        type: 'fan-out',
        version: 1,
        handler: async (ctx) => {
          const handles = await Promise.all(
            Array.from({ length: 3 }, () => ctx.spawnChild<Record<string, never>, void>('long-child', {})),
          )
          await ctx.awaitChildren(handles)
        },
      })

      tr = createTestRunner({ handlers: [fanOut, longChild] })
      const root = await tr.runner.submit({ type: 'fan-out', payload: {}, handlerVersion: 1 })
      await new Promise<void>((r) => setTimeout(r, 100))

      await tr.runner.cancel(root.id, 'shut down')
      await new Promise<void>((r) => setTimeout(r, 200))

      const tree = await tr.runner.getTree(root.id)
      expect(tree.children.length).toBe(3)
      for (const child of tree.children) {
        expect(child.task.status).toBe('cancelled')
      }
    })

    it('persists cancel reason in the event log', async () => {
      tr = createTestRunner({ handlers: [] })
      const task = await tr.runner.submit({ type: 'echo', payload: { value: 'x' }, handlerVersion: 1 })
      await tr.runner.cancel(task.id, 'no longer needed')

      const result = await tr.runner.get(task.id)
      const cancelEvt = result?.events.find((e) => e.kind === 'cancellation-requested')
      expect(cancelEvt).toBeDefined()
      expect(cancelEvt?.kind === 'cancellation-requested' ? cancelEvt.reason : undefined).toBe('no longer needed')
    })
  })

  describe('cycle detection', () => {
    it('accepts a normal parent → child link without false-positive cycle', async () => {
      tr = createTestRunner({ handlers: [echoHandler] })
      const a = await tr.runner.submit({ type: 'echo', payload: { value: 'a' }, handlerVersion: 1 })
      await runTaskToCompletion({ runner: tr.runner, taskId: a.id })

      const b = await tr.runner.submit({
        type: 'echo',
        payload: { value: 'child-of-a' },
        handlerVersion: 1,
        parentTaskId: a.id,
      })
      expect(b.parentTaskId).toBe(a.id)
    })
  })

  describe('delayed dispatch (notBefore)', () => {
    it('does not run a task before notBefore', async () => {
      tr = createTestRunner({ handlers: [echoHandler] })
      const future = new Date(Date.now() + 200)
      const task = await tr.runner.submit({
        type: 'echo',
        payload: { value: 'soon' },
        handlerVersion: 1,
        notBefore: future,
      })

      await new Promise<void>((r) => setTimeout(r, 50))
      const early = await tr.runner.get(task.id)
      expect(early?.status).toBe('pending')

      const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })
      expect(completed.status).toBe('succeeded')
    })
  })

  describe('attempt records', () => {
    it("starts in 'in-progress' status and finalizes to 'succeeded'", async () => {
      tr = createTestRunner({ handlers: [echoHandler] })
      const task = await tr.runner.submit({ type: 'echo', payload: { value: 'hi' }, handlerVersion: 1 })
      const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      expect(completed.attempts).toHaveLength(1)
      expect(completed.attempts[0].status).toBe('succeeded')
      expect(completed.attempts[0].finishedAt).toBeDefined()
    })

    it("records 'failed' status with error info on retry exhaustion", async () => {
      tr = createTestRunner({ handlers: [retryHandler] })
      const task = await tr.runner.submit({
        type: 'retry-me',
        payload: { failUntilAttempt: 99 },
        handlerVersion: 1,
      })
      const completed = await runTaskToCompletion({ runner: tr.runner, taskId: task.id })
      for (const a of completed.attempts) {
        expect(a.status).toBe('failed')
        expect(a.error?.message).toMatch(/attempt \d+ failed/)
      }
    })
  })

  describe('replay determinism', () => {
    it('returns cached now() / random() values on resumption from waiting', async () => {
      const sentinelChild = defineTaskHandler<Record<string, never>, { ok: true }>({
        type: 'sentinel',
        version: 1,
        handler: async () => ({ ok: true }),
      })

      const observedNows: string[] = []
      const observedRands: number[] = []
      const replayParent = defineTaskHandler<Record<string, never>, void>({
        type: 'replay-parent',
        version: 1,
        handler: async (ctx) => {
          observedNows.push(ctx.now().toISOString())
          observedRands.push(ctx.random())
          const handle = await ctx.spawnChild<Record<string, never>, { ok: true }>('sentinel', {})
          await ctx.awaitChildren([handle])
        },
      })

      tr = createTestRunner({ handlers: [replayParent, sentinelChild] })
      const task = await tr.runner.submit({ type: 'replay-parent', payload: {}, handlerVersion: 1 })
      const result = await runTaskToCompletion({ runner: tr.runner, taskId: task.id, timeoutMs: 5000 })
      expect(result.status).toBe('succeeded')

      // Handler ran once before suspension (await children), then once more after wake — same step 0/1 → same values.
      expect(observedNows.length).toBeGreaterThanOrEqual(2)
      expect(observedRands.length).toBeGreaterThanOrEqual(2)
      expect(new Set(observedNows).size).toBe(1)
      expect(new Set(observedRands).size).toBe(1)
    })
  })

  describe('visibility timeout', () => {
    it('marks the stalled attempt as timed-out and reschedules the task', async () => {
      const stalls = defineTaskHandler<Record<string, never>, void>({
        type: 'stall',
        version: 1,
        visibilityTimeoutMs: 80,
        retryPolicy: { maxAttempts: 1, backoff: 'none', baseDelayMs: 0, jitter: 0 },
        handler: async (ctx) => {
          await ctx.sleep(60_000)
        },
      })

      tr = createTestRunner({ handlers: [stalls], sweepIntervalMs: 30 })
      const task = await tr.runner.submit({ type: 'stall', payload: {}, handlerVersion: 1 })

      await new Promise<void>((r) => setTimeout(r, 250))
      const reclaimed = await tr.runner.get(task.id)
      const timedOut = reclaimed?.attempts.find((a) => a.status === 'timed-out')
      expect(timedOut).toBeDefined()
      expect(timedOut?.finishedAt).toBeDefined()
    })
  })
})
