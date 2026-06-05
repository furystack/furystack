/**
 * Cross-process multi-worker smoke (PRD F2 / Milestone 6 precursor).
 *
 * Forks real OS worker processes (`child_process.fork`) that each host their
 * own injector, Redis client and `RedisTaskRunner`, sharing one broker. The
 * Task + TaskReplayLog datasets are bound to `@furystack/redis-store` so task
 * state is coherent across processes (this is what F1 + F1b unblocked — the
 * runner cannot use an in-memory store cross-process). The cross-node bus is
 * in-process per child: the scenarios below (claim concurrency, fleet cap,
 * visibility reclaim, drain) are all broker- or worker-local and need no
 * cross-process bus delivery.
 *
 * Scenarios:
 *
 * 1. **Claim concurrency / no double-execute** — two worker processes drain a
 *    batch of tasks; every task runs exactly once across the fleet.
 * 2. **Fleet cap** — `concurrencyLimits` holds the max-concurrent count for a
 *    type across both processes (measured via a shared Redis counter).
 * 3. **Visibility reclaim** — a worker is `SIGKILL`ed mid-handler; a second
 *    worker reclaims the stalled claim (`XAUTOCLAIM`) and completes it.
 * 4. **Graceful drain** — a worker drains mid-flight: the in-flight task
 *    finishes and no further task is claimed.
 *
 * **Build prereq.** Children execute the compiled `esm/*.js`, so the package
 * must be built before this runs. CI runs `yarn build` before `yarn test`;
 * a local isolated run needs `yarn workspace @furystack/redis-task-runner build`
 * first.
 *
 * **Redis prereq.** Broker reachable at `REDIS_URL` (default
 * `redis://localhost:6379`); CI brings it up via `docker compose up -d`.
 */
import { fork, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BlobStore, InMemoryBlobStore } from '@furystack/blob-store'
import type { PhysicalStore } from '@furystack/core'
import { CrossNodeBus, defineInProcessCrossNodeBus } from '@furystack/cross-node-bus'
import { createInjector, type Injector } from '@furystack/inject'
import { RedisStore } from '@furystack/redis-store'
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
} from '@furystack/task-runner'
import { defineRedisTaskRunner } from './define-redis-task-runner.js'
import { createClient, type RedisClientType } from 'redis'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const CHILD_CONFIG_ENV = 'CHILD_CONFIG'

type ChildConfig = {
  id: string
  topicPrefix: string
  storePrefix: string
  concurrency: number
  visibilityMs: number
  capLimit?: number
}

type ParentToChild = { kind: 'drain' } | { kind: 'shutdown' }
type ChildToParent = { kind: 'ready'; id: string } | { kind: 'drained'; id: string } | { kind: 'log'; line: string }

/** Tracks the max concurrent value seen in `KEYS[1]` against the live count. */
const MAX_SCRIPT = `
local m = tonumber(redis.call('GET', KEYS[1]) or '0')
local v = tonumber(ARGV[1])
if v > m then redis.call('SET', KEYS[1], v) end
return v
`

const sleep = (ms: number): Promise<void> => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

type RedisLikeClient = RedisClientType

const evalScript = (client: RedisLikeClient, script: string, keys: string[], args: string[]): Promise<unknown> => {
  const evalFn = client.eval as (s: string, opts: { keys: string[]; arguments: string[] }) => Promise<unknown>
  return evalFn.call(client, script, { keys, arguments: args })
}

/**
 * Handlers shared by every worker. Each records progress in shared Redis keys
 * (under the `${storePrefix}c:` namespace) so the parent can assert behavior
 * across processes.
 */
const buildHandlers = (client: RedisLikeClient, ns: string): AnyTaskHandlerDescriptor[] => {
  const echo = defineTaskHandler<Record<string, never>, { ok: true }>({
    type: 'echo',
    version: 1,
    handler: async (ctx) => {
      await client.incr(`${ns}exec:${ctx.taskId}`)
      return { ok: true }
    },
  })

  const capped = defineTaskHandler<Record<string, never>, void>({
    type: 'capped',
    version: 1,
    handler: async () => {
      const live = await client.incr(`${ns}live`)
      await evalScript(client, MAX_SCRIPT, [`${ns}max`], [String(live)])
      await sleep(300)
      await client.decr(`${ns}live`)
    },
  })

  const reclaim = defineTaskHandler<Record<string, never>, void>({
    type: 'reclaim',
    version: 1,
    retryPolicy: { maxAttempts: 1, backoff: 'none', baseDelayMs: 0, jitter: 0 },
    handler: async () => {
      await client.incr(`${ns}reclaim:starts`)
      await sleep(5000)
      await client.incr(`${ns}reclaim:finishes`)
    },
  })

  const drainable = defineTaskHandler<Record<string, never>, void>({
    type: 'drain',
    version: 1,
    handler: async () => {
      await client.incr(`${ns}drain:started`)
      await sleep(700)
      await client.incr(`${ns}drain:done`)
    },
  })

  return [echo, capped, reclaim, drainable]
}

const bindRuntime = (
  injector: Injector,
  client: RedisLikeClient,
  config: Pick<ChildConfig, 'id' | 'topicPrefix' | 'storePrefix' | 'visibilityMs' | 'capLimit'>,
): void => {
  injector.bind(BlobStore, ({ onDispose }) => {
    const store = new InMemoryBlobStore({ name: `${config.id}-blobs` })
    // eslint-disable-next-line furystack/prefer-using-wrapper -- delegated to onDispose
    onDispose(() => store[Symbol.dispose]())
    return store
  })
  injector.bind(CrossNodeBus, defineInProcessCrossNodeBus())
  // `as PhysicalStore` bridges the method-param variance gap between
  // `RedisStore`'s `TWriteableData` (id required) and the StoreToken's
  // `WithOptionalId` — the same shape `defineStore` accepts via bivariance.
  injector.bind(
    TaskStore,
    () =>
      new RedisStore({ model: Task, primaryKey: 'id', client, keyPrefix: `${config.storePrefix}t` }) as PhysicalStore<
        Task,
        'id'
      >,
  )
  injector.bind(
    TaskReplayLogStore,
    () =>
      new RedisStore({
        model: TaskReplayLogEntry,
        primaryKey: 'id',
        client,
        keyPrefix: `${config.storePrefix}r`,
      }) as PhysicalStore<TaskReplayLogEntry, 'id'>,
  )
  injector.bind(
    TaskRunner,
    defineRedisTaskRunner({
      client,
      serviceName: config.id,
      topicPrefix: config.topicPrefix,
      visibilityTimeoutMs: config.visibilityMs,
      blockTimeoutMs: 50,
      retryBackoffMs: 50,
      schedulerIntervalMs: 50,
      reconcilerIntervalMs: 1_000_000,
      concurrencyLimits: config.capLimit !== undefined ? { capped: config.capLimit } : undefined,
    }),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Child worker process.
// ─────────────────────────────────────────────────────────────────────────────

const runChild = async (config: ChildConfig): Promise<void> => {
  const send = (message: ChildToParent): void => {
    process.send?.(message)
  }

  const client = createClient({ url: REDIS_URL })
  await client.connect()

  const injector = createInjector()
  bindRuntime(injector, client, config)
  const runner = injector.get(TaskRunner)
  const worker = runner.registerWorker({
    name: config.id,
    handlers: buildHandlers(client, `${config.storePrefix}c:`),
    concurrency: config.concurrency,
    tags: [],
    compatibleVersions: {},
  })

  process.on('message', (message: ParentToChild) => {
    void (async () => {
      if (message.kind === 'drain') {
        await worker.drain({ timeoutMs: 5000 })
        send({ kind: 'drained', id: config.id })
      } else {
        worker[Symbol.dispose]()
        await injector[Symbol.asyncDispose]()
        if (client.isOpen) await client.quit()
        process.exit(0)
      }
    })().catch((error: unknown) => send({ kind: 'log', line: `${config.id} crashed: ${String(error)}` }))
  })

  send({ kind: 'ready', id: config.id })
}

const isChildMode = process.argv[2] === 'child'

if (isChildMode) {
  const raw = process.env[CHILD_CONFIG_ENV]
  if (!raw) {
    process.stderr.write('cross-process-smoke child requires CHILD_CONFIG\n')
    process.exit(1)
  } else {
    runChild(JSON.parse(raw) as ChildConfig).catch((error: unknown) => {
      process.stderr.write(`child crashed: ${(error as Error).stack ?? String(error)}\n`)
      process.exit(1)
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Parent / vitest side.
// ─────────────────────────────────────────────────────────────────────────────

const COMPILED_SPEC_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'esm', 'cross-process-smoke.spec.js')

type Worker = {
  id: string
  child: ChildProcess
  receive: (predicate: (message: ChildToParent) => boolean, timeoutMs?: number) => Promise<ChildToParent>
}

const forkWorker = (config: ChildConfig): Worker => {
  const inbox: ChildToParent[] = []
  const listeners = new Set<(message: ChildToParent) => void>()

  const child = fork(COMPILED_SPEC_PATH, ['child', config.id], {
    env: { ...process.env, [CHILD_CONFIG_ENV]: JSON.stringify(config) },
  })

  child.on('message', (message) => {
    const typed = message as ChildToParent
    inbox.push(typed)
    for (const listener of listeners) listener(typed)
  })

  const receive = (predicate: (message: ChildToParent) => boolean, timeoutMs = 8000): Promise<ChildToParent> => {
    const matched = inbox.find(predicate)
    if (matched) return Promise.resolve(matched)
    return new Promise((resolveReceive, reject) => {
      const timer = setTimeout(() => {
        listeners.delete(handler)
        reject(new Error(`Timed out after ${timeoutMs}ms waiting on ${config.id}`))
      }, timeoutMs)
      const handler = (message: ChildToParent): void => {
        if (predicate(message)) {
          clearTimeout(timer)
          listeners.delete(handler)
          resolveReceive(message)
        }
      }
      listeners.add(handler)
    })
  }

  return { id: config.id, child, receive }
}

const shutdownWorker = async (worker: Worker): Promise<void> => {
  if (worker.child.exitCode !== null || worker.child.signalCode !== null) return
  worker.child.send({ kind: 'shutdown' } satisfies ParentToChild)
  await new Promise<void>((resolveExit) => {
    if (worker.child.exitCode !== null) resolveExit()
    else worker.child.once('exit', () => resolveExit())
  })
}

type Parent = {
  runner: TaskRunner
  client: RedisLikeClient
  [Symbol.asyncDispose]: () => Promise<void>
}

const buildParent = async (topicPrefix: string, storePrefix: string): Promise<Parent> => {
  const client = createClient({ url: REDIS_URL })
  await client.connect()
  const injector = createInjector()
  bindRuntime(injector, client, { id: 'parent', topicPrefix, storePrefix, visibilityMs: 60_000 })
  const runner = injector.get(TaskRunner)
  return {
    runner,
    client,
    [Symbol.asyncDispose]: async () => {
      await injector[Symbol.asyncDispose]()
      if (client.isOpen) await client.quit()
    },
  }
}

const waitFor = async (predicate: () => Promise<boolean>, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return
    await sleep(75)
  }
  throw new Error(`waitFor: timed out after ${timeoutMs}ms`)
}

const pollStatus = async (parent: Parent, taskId: string, timeoutMs: number): Promise<TaskStatus | undefined> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const task = await parent.runner.get(taskId)
    if (task && isTerminalStatus(task.status)) return task.status
    await sleep(100)
  }
  return (await parent.runner.get(taskId))?.status
}

const num = (value: string | null): number => (value ? Number(value) : 0)

if (!isChildMode) {
  describe('cross-process smoke (PRD F2)', () => {
    let topicPrefix: string
    let storePrefix: string
    let active: Worker[] = []

    const fork_ = (config: Omit<ChildConfig, 'topicPrefix' | 'storePrefix'>): Worker => {
      const worker = forkWorker({ ...config, topicPrefix, storePrefix })
      active.push(worker)
      return worker
    }

    const awaitReady = async (...workers: Worker[]): Promise<void> => {
      await Promise.all(workers.map((worker) => worker.receive((message) => message.kind === 'ready')))
    }

    beforeEach(() => {
      topicPrefix = `xp-${randomUUID().slice(0, 8)}/`
      storePrefix = `xps-${randomUUID().slice(0, 8)}/`
      active = []
    })

    afterEach(async () => {
      await Promise.all(active.map(shutdownWorker))
      active = []
      const client = createClient({ url: REDIS_URL })
      try {
        await client.connect()
        for (const prefix of [topicPrefix, storePrefix]) {
          const keys = await client.keys(`${prefix}*`)
          if (keys.length > 0) await client.del(keys)
        }
      } catch {
        // Redis unreachable — the test bodies already failed loudly.
      } finally {
        if (client.isOpen) await client.quit()
      }
    }, 15_000)

    it('runs each task exactly once across two worker processes', async () => {
      await using parent = await buildParent(topicPrefix, storePrefix)
      const w1 = fork_({ id: 'w1', concurrency: 2, visibilityMs: 60_000 })
      const w2 = fork_({ id: 'w2', concurrency: 2, visibilityMs: 60_000 })
      await awaitReady(w1, w2)

      const tasks = await Promise.all(
        Array.from({ length: 8 }, () => parent.runner.submit({ type: 'echo', payload: {}, handlerVersion: 1 })),
      )

      for (const task of tasks) {
        expect(await pollStatus(parent, task.id, 15_000)).toBe('succeeded')
      }
      for (const task of tasks) {
        expect(num(await parent.client.get(`${storePrefix}c:exec:${task.id}`))).toBe(1)
      }
    }, 40_000)

    it('enforces a fleet-wide concurrency cap across two worker processes', async () => {
      await using parent = await buildParent(topicPrefix, storePrefix)
      const w1 = fork_({ id: 'w1', concurrency: 2, visibilityMs: 60_000, capLimit: 2 })
      const w2 = fork_({ id: 'w2', concurrency: 2, visibilityMs: 60_000, capLimit: 2 })
      await awaitReady(w1, w2)

      const tasks = await Promise.all(
        Array.from({ length: 6 }, () => parent.runner.submit({ type: 'capped', payload: {}, handlerVersion: 1 })),
      )

      for (const task of tasks) {
        expect(await pollStatus(parent, task.id, 20_000)).toBe('succeeded')
      }

      const maxConcurrent = num(await parent.client.get(`${storePrefix}c:max`))
      expect(maxConcurrent).toBeLessThanOrEqual(2)
      expect(maxConcurrent).toBe(2)
    }, 40_000)

    it('reclaims a task after the owning worker process is killed', async () => {
      await using parent = await buildParent(topicPrefix, storePrefix)
      const victim = fork_({ id: 'victim', concurrency: 1, visibilityMs: 1000 })
      await awaitReady(victim)

      const task = await parent.runner.submit({ type: 'reclaim', payload: {}, handlerVersion: 1 })
      await waitFor(async () => num(await parent.client.get(`${storePrefix}c:reclaim:starts`)) >= 1, 10_000)

      // Hard-kill the worker mid-handler; its claim goes stale in the PEL.
      victim.child.kill('SIGKILL')

      const survivor = fork_({ id: 'survivor', concurrency: 1, visibilityMs: 1000 })
      await awaitReady(survivor)

      expect(await pollStatus(parent, task.id, 25_000)).toBe('succeeded')
      expect(num(await parent.client.get(`${storePrefix}c:reclaim:finishes`))).toBeGreaterThanOrEqual(1)
    }, 45_000)

    it('drains a worker process: in-flight task finishes, no new task is claimed', async () => {
      await using parent = await buildParent(topicPrefix, storePrefix)
      const worker = fork_({ id: 'w1', concurrency: 1, visibilityMs: 60_000 })
      await awaitReady(worker)

      const inFlight = await parent.runner.submit({ type: 'drain', payload: {}, handlerVersion: 1 })
      await waitFor(async () => num(await parent.client.get(`${storePrefix}c:drain:started`)) >= 1, 10_000)

      worker.child.send({ kind: 'drain' } satisfies ParentToChild)
      const queued = await parent.runner.submit({ type: 'drain', payload: {}, handlerVersion: 1 })

      await worker.receive((message) => message.kind === 'drained', 10_000)

      // The in-flight task completed despite the drain.
      expect((await parent.runner.get(inFlight.id))?.status).toBe('succeeded')
      expect(num(await parent.client.get(`${storePrefix}c:drain:done`))).toBe(1)

      // The second task was never claimed by the drained worker.
      await sleep(500)
      expect((await parent.runner.get(queued.id))?.status).toBe('pending')
      expect(num(await parent.client.get(`${storePrefix}c:drain:started`))).toBe(1)
    }, 40_000)
  })
}
