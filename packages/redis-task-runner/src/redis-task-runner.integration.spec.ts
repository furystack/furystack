import { randomUUID } from 'node:crypto'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import { CrossNodeBus, defineInProcessCrossNodeBus } from '@furystack/cross-node-bus'
import { createInjector, type Injector } from '@furystack/inject'
import {
  defineTaskHandler,
  TaskRunner,
  type AnyTaskHandlerDescriptor,
  type TaskRunnerCapabilities,
  type Worker,
} from '@furystack/task-runner'
import { runTaskToCompletion } from '@furystack/task-runner/testing'
import { createClient } from 'redis'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineRedisTaskRunner } from './define-redis-task-runner.js'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

type Harness = {
  injector: Injector
  runner: TaskRunner
  workers: Worker[]
  prefix: string
  client: ReturnType<typeof createClient>
  [Symbol.asyncDispose]: () => Promise<void>
}

const buildHarness = async (options: {
  prefix: string
  workerCount: number
  handlers: AnyTaskHandlerDescriptor[]
  visibilityTimeoutMs?: number
  schedulerIntervalMs?: number
}): Promise<Harness> => {
  const client = createClient({ url: REDIS_URL })
  await client.connect()

  const injector = createInjector()
  injector.bind(BlobStore, ({ onDispose }) => {
    const store = new InMemoryBlobStore({ name: 'integration-blobs' })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
    onDispose(() => store[Symbol.dispose]())
    return store
  })
  injector.bind(CrossNodeBus, defineInProcessCrossNodeBus())

  injector.bind(
    TaskRunner,
    defineRedisTaskRunner({
      client,
      serviceName: 'integration',
      topicPrefix: options.prefix,
      visibilityTimeoutMs: options.visibilityTimeoutMs ?? 60_000,
      blockTimeoutMs: 50,
      schedulerIntervalMs: options.schedulerIntervalMs ?? 50,
      reconcilerIntervalMs: 200,
      sweepIntervalMs: 100,
    }),
  )

  const runner = injector.get(TaskRunner)
  const workers: Worker[] = []
  for (let i = 0; i < options.workerCount; i++) {
    workers.push(
      runner.registerWorker({
        name: `worker-${i}`,
        handlers: options.handlers,
        concurrency: 2,
        tags: [],
        compatibleVersions: {},
      }),
    )
  }

  return {
    injector,
    runner,
    workers,
    prefix: options.prefix,
    client,
    async [Symbol.asyncDispose]() {
      for (const w of workers) w[Symbol.dispose]()
      await injector[Symbol.asyncDispose]()
      if (client.isOpen) await client.quit()
    },
  }
}

const cleanupStreams = async (prefix: string): Promise<void> => {
  const client = createClient({ url: REDIS_URL })
  try {
    await client.connect()
    const keys = await client.keys(`${prefix}*`)
    if (keys.length > 0) await client.del(keys)
  } catch {
    // Redis unreachable; setup will fail loudly in a per-test path.
  } finally {
    if (client.isOpen) await client.quit()
  }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

describe('RedisTaskRunner (integration)', () => {
  let prefix: string

  beforeEach(() => {
    prefix = `rtr-${randomUUID().slice(0, 8)}/`
  })

  afterEach(async () => {
    await cleanupStreams(prefix)
  })

  it('declares persistent + delayedDispatch=true capabilities', async () => {
    await using harness = await buildHarness({ prefix, workerCount: 0, handlers: [] })
    const caps: TaskRunnerCapabilities = harness.runner.capabilities
    expect(caps.persistent).toBe(true)
    expect(caps.delayedDispatch).toBe(true)
    expect(caps.fleetCapEnforcement).toBe(false)
  })

  it('honors notBefore by parking the task in the scheduler ZSET until it is due', async () => {
    const ranAt: number[] = []
    const stamper = defineTaskHandler<Record<string, never>, void>({
      type: 'stamp',
      version: 1,
      handler: async (ctx) => {
        ranAt.push(ctx.now().getTime())
      },
    })

    await using harness = await buildHarness({ prefix, workerCount: 1, handlers: [stamper] })
    const submittedAt = Date.now()
    const dueAt = submittedAt + 400
    const task = await harness.runner.submit({
      type: 'stamp',
      payload: {},
      handlerVersion: 1,
      notBefore: new Date(dueAt),
    })

    // Task should still be 'pending' shortly after submit and the
    // queue stream should be empty — payload is parked in the
    // scheduler ZSET. Allow a small tolerance for clock drift.
    await sleep(120)
    const streamLen = await harness.client.xLen(`${prefix}tasks:queue:stamp:v1`).catch(() => 0)
    expect(streamLen).toBe(0)
    const schedSize = await harness.client.zCard(`${prefix}tasks:scheduler`).catch(() => 0)
    expect(schedSize).toBe(1)

    const completed = await runTaskToCompletion({ runner: harness.runner, taskId: task.id, timeoutMs: 5000 })
    expect(completed.status).toBe('succeeded')
    expect(ranAt).toHaveLength(1)
    // First and only run should not have started before the due time.
    expect(ranAt[0]).toBeGreaterThanOrEqual(dueAt - 50)
  }, 15_000)

  it('submit → claim → handler runs → terminal succeeded (happy path)', async () => {
    const echo = defineTaskHandler<{ value: string }, { echoed: string }>({
      type: 'echo',
      version: 1,
      handler: async (_ctx, payload) => ({ echoed: payload.value }),
    })

    await using harness = await buildHarness({ prefix, workerCount: 1, handlers: [echo] })
    const task = await harness.runner.submit({
      type: 'echo',
      payload: { value: 'hello' },
      handlerVersion: 1,
    })

    const completed = await runTaskToCompletion({ runner: harness.runner, taskId: task.id, timeoutMs: 5000 })
    expect(completed.status).toBe('succeeded')
    expect(completed.result).toEqual({ echoed: 'hello' })
  }, 15_000)

  it('two workers do not double-execute the same task across the fleet', async () => {
    const runs = new Set<string>()
    const counter = defineTaskHandler<{ n: number }, { ran: boolean }>({
      type: 'count-once',
      version: 1,
      handler: async (ctx) => {
        if (runs.has(ctx.taskId)) {
          throw new Error(`Task ${ctx.taskId} ran twice`)
        }
        runs.add(ctx.taskId)
        return { ran: true }
      },
    })

    await using harness = await buildHarness({ prefix, workerCount: 2, handlers: [counter] })
    const tasks = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        harness.runner.submit({ type: 'count-once', payload: { n: i }, handlerVersion: 1 }),
      ),
    )

    for (const task of tasks) {
      const completed = await runTaskToCompletion({ runner: harness.runner, taskId: task.id, timeoutMs: 8000 })
      expect(completed.status).toBe('succeeded')
    }
    expect(runs.size).toBe(8)
  }, 30_000)

  it('reclaims a stalled handler via XAUTOCLAIM and runs it on another consumer', async () => {
    const seenAttempts: number[] = []

    const flaky = defineTaskHandler<Record<string, never>, { ok: true }>({
      type: 'flaky-handler',
      version: 1,
      visibilityTimeoutMs: 250,
      retryPolicy: { maxAttempts: 1, backoff: 'none', baseDelayMs: 0, jitter: 0 },
      handler: async (ctx) => {
        seenAttempts.push(ctx.attempt)
        if (ctx.attempt === 1) {
          // Stall until our cancellation signal fires (the runner core
          // aborts the prior AC when the broker-side reclaim hands the
          // task to a fresh consumer). The throw lets the runner core
          // unwind cleanly and recognise the AC was replaced.
          await new Promise<void>((_, reject) => {
            ctx.cancellationSignal.addEventListener('abort', () => reject(new Error('reclaimed')), { once: true })
          })
        }
        return { ok: true }
      },
    })

    await using harness = await buildHarness({
      prefix,
      workerCount: 2,
      handlers: [flaky],
      visibilityTimeoutMs: 250,
    })

    const task = await harness.runner.submit({
      type: 'flaky-handler',
      payload: {},
      handlerVersion: 1,
    })

    const deadline = Date.now() + 10_000
    while (Date.now() < deadline) {
      const t = await harness.runner.get(task.id)
      if (t?.status === 'succeeded') break
      await sleep(100)
    }
    const final = await harness.runner.get(task.id)
    expect(final?.status).toBe('succeeded')
    expect(seenAttempts.length).toBeGreaterThanOrEqual(2)
    expect(seenAttempts[0]).toBe(1)
  }, 30_000)

  it('draft does not enqueue; start releases to the queue', async () => {
    let observed = 0
    const observe = defineTaskHandler<Record<string, never>, void>({
      type: 'observe',
      version: 1,
      handler: async () => {
        observed += 1
      },
    })

    await using harness = await buildHarness({ prefix, workerCount: 1, handlers: [observe] })

    const drafted = await harness.runner.draft({ type: 'observe', payload: {}, handlerVersion: 1 })
    expect(drafted.status).toBe('draft')

    // Stream should not exist (or have zero entries) before start.
    const streamKey = `${prefix}tasks:queue:observe:v1`
    const lenBefore = await harness.client.xLen(streamKey).catch(() => 0)
    expect(lenBefore).toBe(0)
    expect(observed).toBe(0)

    await harness.runner.start(drafted.id)
    const completed = await runTaskToCompletion({ runner: harness.runner, taskId: drafted.id, timeoutMs: 5000 })
    expect(completed.status).toBe('succeeded')
    expect(observed).toBe(1)
  }, 15_000)

  it('cancel aborts a running handler via the bus broadcast', async () => {
    let aborted = false
    const long = defineTaskHandler<Record<string, never>, void>({
      type: 'long-running',
      version: 1,
      handler: async (ctx) => {
        try {
          await ctx.sleep(60_000)
        } catch {
          aborted = true
          throw ctx.cancellationSignal.reason instanceof Error ? ctx.cancellationSignal.reason : new Error('cancelled')
        }
      },
    })

    await using harness = await buildHarness({ prefix, workerCount: 1, handlers: [long] })
    const task = await harness.runner.submit({ type: 'long-running', payload: {}, handlerVersion: 1 })

    await sleep(300)
    await harness.runner.cancel(task.id, 'integration test')

    const deadline = Date.now() + 5000
    while (Date.now() < deadline) {
      const t = await harness.runner.get(task.id)
      if (t?.status === 'cancelled') break
      await sleep(50)
    }
    const final = await harness.runner.get(task.id)
    expect(final?.status).toBe('cancelled')
    expect(aborted).toBe(true)
  }, 15_000)
})
