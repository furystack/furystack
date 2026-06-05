/**
 * Multi-service smoke (PRD Milestone 6).
 *
 * Two services × two worker pods each, a single Redis broker, an S3
 * (MinIO) blob store, and a per-service `topicPrefix`. Same-process by
 * design — every pod is its own injector with its own Redis clients,
 * `RedisTaskRunner`, `RedisCrossNodeBus`, and Redis-store-backed Task
 * datasets. This mirrors the accepted shape of the cross-node-bus
 * multi-service smoke: cross-process isolation only proves V8 matches
 * injector isolation, which is uninteresting; the value is the full DI +
 * adapter wiring against real infrastructure.
 *
 * Per service, isolation lives in four prefixes sharing one run root so a
 * single `KEYS ${runId}*` sweeps the broker clean:
 *   - queue  `${runId}:${svc}:q/`    (RedisTaskRunner streams / ZSETs)
 *   - store  `${runId}:${svc}:s/`    (RedisStore Task + replay rows)
 *   - bus    `${runId}:${svc}:bus/`  (RedisCrossNodeBus topics)
 *   - count  `${runId}:cnt:${svc}:`  (shared assertion counters)
 * S3 blobs are scoped per service via `keyPrefix` inside one run bucket.
 *
 * Assertions (PRD §13 M6):
 *   1. Tasks submitted to service A run only on service A's workers.
 *   2. Cross-service submission is explicit — B's store never sees A's task.
 *   3. Fleet caps bind fleet-wide across a service's pods.
 *   4. Draining one pod does not lose work (the other pod picks it up).
 *   + S3-backed produced blobs round-trip across the fleet.
 *   + §4 success metrics (submit-to-claim, progress delivery) measured.
 *
 * Gated on a reachable Redis at `REDIS_URL` (default redis://localhost:6379)
 * and MinIO at `MINIO_URL` (default http://localhost:9000).
 */
import { randomUUID } from 'node:crypto'
import { CreateBucketCommand, DeleteBucketCommand, S3Client } from '@aws-sdk/client-s3'
import { BlobStore } from '@furystack/blob-store'
import type { PhysicalStore } from '@furystack/core'
import { CrossNodeBus, type BusMessage } from '@furystack/cross-node-bus'
import { createInjector, type Injector } from '@furystack/inject'
import { defineRedisCrossNodeBusAdapter, RedisCrossNodeBus } from '@furystack/redis-cross-node-bus'
import { RedisStore } from '@furystack/redis-store'
import { defineS3BlobStore } from '@furystack/s3-blob-store'
import {
  defineTaskHandler,
  isTerminalStatus,
  Task,
  TaskReplayLogEntry,
  TaskReplayLogStore,
  TaskRunner,
  TaskStore,
  type AnyTaskHandlerDescriptor,
  type TaskStatus,
  type TaskUpdate,
} from '@furystack/task-runner'
import { createClient, type RedisClientType } from 'redis'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { defineRedisTaskRunner } from './define-redis-task-runner.js'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const MINIO_URL = process.env.MINIO_URL ?? 'http://localhost:9000'
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minioadmin'
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'minioadmin'

/** §4 budgets. The targets are 50 ms (submit→claim) and 100 ms (progress);
 *  the assert budget is intentionally generous so the smoke does not flake on
 *  loaded CI — the real measured p95 is logged for the record either way. */
const SUBMIT_TO_CLAIM_BUDGET_MS = 1000
const PROGRESS_DELIVERY_BUDGET_MS = 1000

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const MAX_SCRIPT = `
local m = tonumber(redis.call('GET', KEYS[1]) or '0')
local v = tonumber(ARGV[1])
if v > m then redis.call('SET', KEYS[1], v) end
return v
`

const evalScript = (client: RedisClientType, script: string, keys: string[], args: string[]): Promise<unknown> => {
  const evalFn = client.eval as (s: string, opts: { keys: string[]; arguments: string[] }) => Promise<unknown>
  return evalFn.call(client, script, { keys, arguments: args })
}

const percentile = (samples: readonly number[], p: number): number => {
  if (samples.length === 0) return Number.NaN
  const sorted = [...samples].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(sorted.length - 1, rank))]
}

type ServicePrefixes = { queue: string; store: string; bus: string; count: string; blob: string }

const buildHandlers = (control: RedisClientType, ns: string, podId: string): AnyTaskHandlerDescriptor[] => {
  const echo = defineTaskHandler<Record<string, never>, { ok: true }>({
    type: 'echo',
    version: 1,
    handler: async (ctx) => {
      await control.set(`${ns}start:${ctx.taskId}`, String(ctx.now().getTime()))
      await control.set(`${ns}ranBy:${ctx.taskId}`, podId)
      await control.incr(`${ns}execBy:${podId}`)
      return { ok: true }
    },
  })

  const capped = defineTaskHandler<Record<string, never>, void>({
    type: 'capped',
    version: 1,
    handler: async () => {
      const live = await control.incr(`${ns}live`)
      await evalScript(control, MAX_SCRIPT, [`${ns}max`], [String(live)])
      await sleep(250)
      await control.decr(`${ns}live`)
    },
  })

  const slow = defineTaskHandler<Record<string, never>, void>({
    type: 'slow',
    version: 1,
    handler: async (ctx) => {
      await control.incr(`${ns}slow:started`)
      await control.set(`${ns}slowBy:${ctx.taskId}`, podId)
      await sleep(700)
      await control.incr(`${ns}slow:done`)
    },
  })

  const blobbed = defineTaskHandler<Record<string, never>, { key: string }>({
    type: 'blobbed',
    version: 1,
    handler: async (ctx) => {
      await control.set(`${ns}start:${ctx.taskId}`, String(ctx.now().getTime()))
      ctx.reportProgress({ percent: 50, meta: { sentAt: ctx.now().getTime() } })
      const key = `out/${ctx.taskId}.txt`
      await ctx.blobStore.put(key, Buffer.from(`blob-${ctx.taskId}`))
      return { key }
    },
  })

  return [echo, capped, slow, blobbed]
}

type Pod = {
  podId: string
  injector: Injector
  runner: TaskRunner
  client: RedisClientType
  busClient: RedisClientType
  drain: () => Promise<void>
  [Symbol.asyncDispose]: () => Promise<void>
}

const setupPod = async (options: {
  serviceName: string
  podId: string
  prefixes: ServicePrefixes
  control: RedisClientType
  s3: S3Client
  bucket: string
  concurrency: number
  concurrencyLimits?: Record<string, number>
  visibilityTimeoutMs?: number
}): Promise<Pod> => {
  const client = createClient({ url: REDIS_URL })
  const busClient = createClient({ url: REDIS_URL })
  await client.connect()
  await busClient.connect()

  const injector = createInjector()
  injector.bind(
    BlobStore,
    defineS3BlobStore({
      client: options.s3,
      bucket: options.bucket,
      keyPrefix: options.prefixes.blob,
      name: `${options.serviceName}-s3`,
      manageLifecycle: false,
    }),
  )
  injector.bind(
    CrossNodeBus,
    defineRedisCrossNodeBusAdapter({
      client: busClient,
      serviceName: options.serviceName,
      topicPrefix: options.prefixes.bus,
      nodeId: options.podId,
    }),
  )
  // `as PhysicalStore` bridges the RedisStore `TWriteableData` (id required)
  // vs. the StoreToken's `WithOptionalId` param-variance gap — the same shape
  // `defineStore` accepts via bivariance.
  injector.bind(
    TaskStore,
    () =>
      new RedisStore({
        model: Task,
        primaryKey: 'id',
        client,
        keyPrefix: `${options.prefixes.store}t`,
      }) as PhysicalStore<Task, 'id'>,
  )
  injector.bind(
    TaskReplayLogStore,
    () =>
      new RedisStore({
        model: TaskReplayLogEntry,
        primaryKey: 'id',
        client,
        keyPrefix: `${options.prefixes.store}r`,
      }) as PhysicalStore<TaskReplayLogEntry, 'id'>,
  )
  injector.bind(
    TaskRunner,
    defineRedisTaskRunner({
      client,
      serviceName: options.serviceName,
      topicPrefix: options.prefixes.queue,
      visibilityTimeoutMs: options.visibilityTimeoutMs ?? 60_000,
      blockTimeoutMs: 25,
      retryBackoffMs: 50,
      schedulerIntervalMs: 50,
      reconcilerIntervalMs: 1_000_000,
      sweepIntervalMs: 200,
      concurrencyLimits: options.concurrencyLimits,
    }),
  )

  const runner = injector.get(TaskRunner)
  const worker = runner.registerWorker({
    name: options.podId,
    handlers: buildHandlers(options.control, options.prefixes.count, options.podId),
    concurrency: options.concurrency,
    tags: [],
    compatibleVersions: {},
  })

  return {
    podId: options.podId,
    injector,
    runner,
    client,
    busClient,
    drain: () => worker.drain({ timeoutMs: 5000 }),
    async [Symbol.asyncDispose]() {
      worker[Symbol.dispose]()
      await injector[Symbol.asyncDispose]()
      if (client.isOpen) await client.quit()
      if (busClient.isOpen) await busClient.quit()
    },
  }
}

type Observer = {
  bus: RedisCrossNodeBus
  injector: Injector
  client: RedisClientType
  [Symbol.asyncDispose]: () => Promise<void>
}

const setupObserver = async (serviceName: string, prefixes: ServicePrefixes): Promise<Observer> => {
  const client = createClient({ url: REDIS_URL })
  await client.connect()
  const injector = createInjector()
  injector.bind(
    CrossNodeBus,
    defineRedisCrossNodeBusAdapter({ client, serviceName, topicPrefix: prefixes.bus, nodeId: `${serviceName}-obs` }),
  )
  const bus = injector.get(CrossNodeBus)
  if (!(bus instanceof RedisCrossNodeBus)) throw new Error('expected RedisCrossNodeBus binding')
  return {
    bus,
    injector,
    client,
    async [Symbol.asyncDispose]() {
      await injector[Symbol.asyncDispose]()
      if (client.isOpen) await client.quit()
    },
  }
}

const prefixesFor = (runId: string, svc: string): ServicePrefixes => ({
  queue: `${runId}:${svc}:q/`,
  store: `${runId}:${svc}:s/`,
  bus: `${runId}:${svc}:bus/`,
  count: `${runId}:cnt:${svc}:`,
  blob: `${runId}/${svc}/blobs/`,
})

const makeS3 = (): S3Client =>
  new S3Client({
    endpoint: MINIO_URL,
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId: MINIO_ACCESS_KEY, secretAccessKey: MINIO_SECRET_KEY },
  })

const cleanupRedis = async (runId: string): Promise<void> => {
  const client = createClient({ url: REDIS_URL })
  try {
    await client.connect()
    const keys = await client.keys(`${runId}*`)
    if (keys.length > 0) await client.del(keys)
  } catch {
    // Redis unreachable — the test bodies already failed loudly.
  } finally {
    if (client.isOpen) await client.quit()
  }
}

const num = (value: string | null): number => (value ? Number(value) : 0)

const pollStatus = async (runner: TaskRunner, taskId: string, timeoutMs: number): Promise<TaskStatus | undefined> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const task = await runner.get(taskId)
    if (task && isTerminalStatus(task.status)) return task.status
    await sleep(60)
  }
  return (await runner.get(taskId))?.status
}

const waitFor = async (predicate: () => Promise<boolean>, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return
    await sleep(60)
  }
  throw new Error(`waitFor: timed out after ${timeoutMs}ms`)
}

describe('multi-service smoke (PRD M6)', () => {
  let runId: string
  let control: RedisClientType
  let s3: S3Client
  let bucket: string
  let aPods: Pod[]
  let bPods: Pod[]
  let aObserver: Observer
  let bObserver: Observer
  let aPrefixes: ServicePrefixes
  let bPrefixes: ServicePrefixes

  beforeAll(async () => {
    runId = `m6-${randomUUID().slice(0, 8)}`
    control = createClient({ url: REDIS_URL })
    await control.connect()

    s3 = makeS3()
    bucket = `furystack-m6-${runId}`
    await s3.send(new CreateBucketCommand({ Bucket: bucket }))

    aPrefixes = prefixesFor(runId, 'svc-a')
    bPrefixes = prefixesFor(runId, 'svc-b')

    aPods = await Promise.all(
      ['a0', 'a1'].map((podId) =>
        setupPod({
          serviceName: 'svc-a',
          podId,
          prefixes: aPrefixes,
          control,
          s3,
          bucket,
          concurrency: 2,
          concurrencyLimits: { capped: 2 },
        }),
      ),
    )
    bPods = await Promise.all(
      ['b0', 'b1'].map((podId) =>
        setupPod({ serviceName: 'svc-b', podId, prefixes: bPrefixes, control, s3, bucket, concurrency: 2 }),
      ),
    )
    aObserver = await setupObserver('svc-a', aPrefixes)
    bObserver = await setupObserver('svc-b', bPrefixes)

    // Give the Redis Streams consumer groups + bus cursors a beat to go live.
    await sleep(300)
  }, 40_000)

  afterAll(async () => {
    await Promise.all([...(aPods ?? []), ...(bPods ?? [])].map((p) => p[Symbol.asyncDispose]()))
    if (aObserver) await aObserver[Symbol.asyncDispose]()
    if (bObserver) await bObserver[Symbol.asyncDispose]()
    if (control?.isOpen) await control.quit()
    if (s3 && bucket) {
      try {
        await s3.send(new DeleteBucketCommand({ Bucket: bucket }))
      } catch {
        // Bucket may still hold sweeper-orphaned objects; best-effort.
      }
      s3.destroy()
    }
    await cleanupRedis(runId)
  }, 40_000)

  it('runs each task only on the submitting service, and B never sees A tasks', async () => {
    const aTasks = await Promise.all(
      Array.from({ length: 6 }, () => aPods[0].runner.submit({ type: 'echo', payload: {}, handlerVersion: 1 })),
    )
    const bTasks = await Promise.all(
      Array.from({ length: 6 }, () => bPods[0].runner.submit({ type: 'echo', payload: {}, handlerVersion: 1 })),
    )

    for (const task of aTasks) expect(await pollStatus(aPods[0].runner, task.id, 20_000)).toBe('succeeded')
    for (const task of bTasks) expect(await pollStatus(bPods[0].runner, task.id, 20_000)).toBe('succeeded')

    for (const task of aTasks) {
      const ranBy = await control.get(`${aPrefixes.count}ranBy:${task.id}`)
      expect(['a0', 'a1']).toContain(ranBy)
      // Cross-service: service B's store has no record of an A-submitted task.
      expect(await bPods[0].runner.get(task.id)).toBeUndefined()
    }
    for (const task of bTasks) {
      const ranBy = await control.get(`${bPrefixes.count}ranBy:${task.id}`)
      expect(['b0', 'b1']).toContain(ranBy)
      expect(await aPods[0].runner.get(task.id)).toBeUndefined()
    }
  }, 60_000)

  it('enforces a fleet-wide concurrency cap across a service\u2019s pods', async () => {
    await control.del(`${aPrefixes.count}max`)
    await control.del(`${aPrefixes.count}live`)

    const tasks = await Promise.all(
      Array.from({ length: 6 }, () => aPods[0].runner.submit({ type: 'capped', payload: {}, handlerVersion: 1 })),
    )
    for (const task of tasks) expect(await pollStatus(aPods[0].runner, task.id, 25_000)).toBe('succeeded')

    const maxConcurrent = num(await control.get(`${aPrefixes.count}max`))
    expect(maxConcurrent).toBeLessThanOrEqual(2)
    expect(maxConcurrent).toBe(2)
  }, 60_000)

  it('round-trips an S3-backed produced blob and measures \u00a74 metrics', async () => {
    await aObserver.bus.whenReady(`tasks/progress/blobbed`)
    const progressLags: number[] = []
    using _sub = aObserver.bus.subscribe(`tasks/progress/blobbed`, (msg: BusMessage) => {
      const payload = msg.payload as TaskUpdate
      if (payload.kind !== 'progress') return
      const sentAt = (payload.meta as { sentAt?: number } | undefined)?.sentAt
      if (typeof sentAt === 'number') progressLags.push(Date.now() - sentAt)
    })

    const SAMPLES = 24
    const submitTimes = new Map<string, number>()
    const blobbedTasks = await Promise.all(
      Array.from({ length: SAMPLES }, async () => {
        const task = await aPods[0].runner.submit({ type: 'blobbed', payload: {}, handlerVersion: 1 })
        submitTimes.set(task.id, Date.now())
        return task
      }),
    )

    for (const task of blobbedTasks) expect(await pollStatus(aPods[0].runner, task.id, 30_000)).toBe('succeeded')

    // S3 round-trip: read a produced blob straight from the service's store.
    const sample = blobbedTasks[0]
    const finished = await aPods[0].runner.get(sample.id)
    const producedKey = (finished?.result as { key: string }).key
    const blobStore = aPods[1].injector.get(BlobStore)
    const got = await blobStore.get(producedKey)
    const body = await new Response(got.stream).text()
    expect(body).toBe(`blob-${sample.id}`)

    // §4 metric: submit → claim (proxied by submit → handler entry).
    const claimLags: number[] = []
    for (const task of blobbedTasks) {
      const startedAt = num(await control.get(`${aPrefixes.count}start:${task.id}`))
      const submittedAt = submitTimes.get(task.id)
      if (startedAt > 0 && submittedAt !== undefined) claimLags.push(startedAt - submittedAt)
    }

    // Wait briefly for any in-flight progress frames to land on the observer.
    await waitFor(async () => Promise.resolve(progressLags.length >= 1), 5_000)

    const claimP95 = percentile(claimLags, 95)
    const progressP95 = percentile(progressLags, 95)
    console.log(
      `[M6 §4 metrics] submit→claim: p50=${percentile(claimLags, 50)}ms p95=${claimP95}ms (target <50ms) | ` +
        `progress delivery: p50=${percentile(progressLags, 50)}ms p95=${progressP95}ms (target <100ms) | ` +
        `samples claim=${claimLags.length} progress=${progressLags.length}`,
    )

    expect(claimLags.length).toBeGreaterThan(0)
    expect(progressLags.length).toBeGreaterThan(0)
    expect(claimP95).toBeLessThan(SUBMIT_TO_CLAIM_BUDGET_MS)
    expect(progressP95).toBeLessThan(PROGRESS_DELIVERY_BUDGET_MS)
  }, 60_000)

  it('does not lose work when a pod drains mid-flight', async () => {
    await control.del(`${aPrefixes.count}slow:started`)
    await control.del(`${aPrefixes.count}slow:done`)

    const inFlight = await aPods[0].runner.submit({ type: 'slow', payload: {}, handlerVersion: 1 })
    await waitFor(async () => num(await control.get(`${aPrefixes.count}slow:started`)) >= 1, 15_000)
    const ranBy = await control.get(`${aPrefixes.count}slowBy:${inFlight.id}`)
    const drainingPod = aPods.find((p) => p.podId === ranBy) ?? aPods[0]

    // Drain the pod holding the in-flight task; submit a second task that the
    // sibling pod must pick up.
    const drained = drainingPod.drain()
    const queued = await aPods[0].runner.submit({ type: 'slow', payload: {}, handlerVersion: 1 })
    await drained

    // The in-flight task completed despite the drain.
    expect((await aPods[0].runner.get(inFlight.id))?.status).toBe('succeeded')

    // The queued task is picked up by the other pod and finishes.
    expect(await pollStatus(aPods[0].runner, queued.id, 25_000)).toBe('succeeded')
    const queuedRanBy = await control.get(`${aPrefixes.count}slowBy:${queued.id}`)
    expect(queuedRanBy).not.toBe(drainingPod.podId)
  }, 60_000)
})
