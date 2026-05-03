/**
 * Cross-process smoke test — PRD M4.
 *
 * Spawns four worker processes (`svc-a-1`, `svc-a-2`, `svc-b-1`, `svc-b-2`)
 * via `child_process.fork`, each with its own `Injector`, Redis client and
 * `RedisCrossNodeBus`, and exercises four end-to-end scenarios:
 *
 * 1. Identity invalidation — `a1` publishes `userLoggedOut`; `a2` invalidates
 *    its `UserResolutionCache`; `b1` / `b2` stay populated.
 * 2. Entity-sync — `a1` publishes a raw `EntityChange` on `entity/User`; `a2`
 *    receives the message with a bus-stamped seq.
 * 3. Replay after process death — kills `a2`, publishes five gap messages on
 *    `a1`, respawns `a2` with `RESUME_FROM_SEQ` set to the last-seen seq, and
 *    verifies the new `a2` walks `bus.replay` to fill the gap.
 * 4. Foreign-prefix subscribe — `b1` subscribes to `${prefixA}identity/events`
 *    and sees `a1`'s logout when explicitly opted in.
 *
 * **Why this exists alongside the same-process `multi-service-smoke.spec.ts`:**
 * V8 isolation + cross-process framing only get exercised when each node lives
 * in its own OS process. The same-process spec covers DI wiring; this spec
 * covers transport.
 *
 * **Build prereq.** The spec forks the **compiled** output
 * (`esm/cross-process-smoke.spec.js`) for child workers, so the package must
 * be built before the test can run. CI runs `yarn build` before `yarn test`,
 * so this is automatic. Local devs running an isolated `yarn vitest` should
 * `yarn workspace @furystack/redis-cross-node-bus build` first.
 *
 * **Redis prereq.** Same gating as `redis-cross-node-bus.spec.ts` and
 * `multi-service-smoke.spec.ts` — broker reachable at `REDIS_URL` (default
 * `redis://localhost:6379`). CI brings it up via `docker compose up -d`.
 *
 * Set `SMOKE_VERBOSE=1` to dump every IPC message.
 */
import { fork, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CrossNodeBus } from '@furystack/cross-node-bus'
import { createInjector } from '@furystack/inject'
import { IDENTITY_EVENT_TOPIC, IdentityEventBus, sessionCacheKey, UserResolutionCache } from '@furystack/rest-service'
import { createClient } from 'redis'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineRedisCrossNodeBusAdapter } from './define-redis-cross-node-bus-adapter.js'
import { RedisCrossNodeBus } from './redis-cross-node-bus.js'

type NodeRole = 'a1' | 'a2' | 'b1' | 'b2'
type ServiceConfig = { role: NodeRole; topicPrefix: string; resumeFromSeq?: string }

type ParentToChild =
  | { kind: 'identity:publish'; event: { type: 'userLoggedOut'; sessionId: string } }
  | { kind: 'cache:populate'; sessionId: string; username: string }
  | { kind: 'cache:query'; correlationId: string }
  | { kind: 'entity:subscribe'; correlationId: string }
  | { kind: 'entity:publish'; payload: { type: 'updated'; id: string; change: Record<string, unknown> } }
  | { kind: 'foreign:subscribe'; prefix: string; correlationId: string }
  | { kind: 'shutdown' }

type ChildToParent =
  | { kind: 'ready'; role: NodeRole }
  | { kind: 'cache:size'; correlationId: string; size: number }
  | { kind: 'entity:received'; seq: string; payload: unknown; originId: string }
  | { kind: 'foreign:received'; payload: unknown; originId: string }
  | { kind: 'subscription:ready'; correlationId: string }
  | { kind: 'log'; line: string }

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const SMOKE_VERBOSE = process.env.SMOKE_VERBOSE === '1'
const ENTITY_TOPIC = 'entity/User'
const RESUME_FROM_ENV = 'RESUME_FROM_SEQ'

const verbose = (line: string): void => {
  if (SMOKE_VERBOSE) process.stdout.write(`[verbose] ${line}\n`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Child worker: one bus, one identity facade, one cache, IPC-driven.
// ─────────────────────────────────────────────────────────────────────────────

const runChild = async (config: ServiceConfig): Promise<void> => {
  const send = (message: ChildToParent): void => {
    if (process.send) process.send(message)
  }

  const client = createClient({ url: REDIS_URL })
  await client.connect()

  const injector = createInjector()
  injector.bind(
    CrossNodeBus,
    defineRedisCrossNodeBusAdapter({
      client,
      serviceName: config.role.startsWith('a') ? 'svc-a' : 'svc-b',
      topicPrefix: config.topicPrefix,
      nodeId: config.role,
    }),
  )

  const bus = injector.get(CrossNodeBus)
  if (!(bus instanceof RedisCrossNodeBus)) {
    throw new Error('expected RedisCrossNodeBus binding from defineRedisCrossNodeBusAdapter')
  }
  const cache = injector.get(UserResolutionCache)
  const identityBus = injector.get(IdentityEventBus)

  // Subscriptions are owned by the worker for its full lifetime; the
  // `process.exit(0)` shutdown path tears them down with the injector. No
  // `using` here — the function returns once IPC is wired and `using` would
  // dispose the listener immediately.
  identityBus.subscribe('userLoggedOut', () => undefined)

  await bus.whenReady(IDENTITY_EVENT_TOPIC)

  // If the parent respawned us with `RESUME_FROM_SEQ`, walk replay first so
  // the gap closes before live `subscribe` traffic arrives.
  if (config.resumeFromSeq) {
    const replayed: Array<{ seq: string }> = []
    try {
      for await (const message of bus.replay(ENTITY_TOPIC, config.resumeFromSeq)) {
        if (message.seq) replayed.push({ seq: message.seq })
      }
      send({ kind: 'log', line: `[${config.role}] replay yielded ${replayed.length} entries` })
    } catch (error) {
      send({ kind: 'log', line: `[${config.role}] replay failed: ${(error as Error).message}` })
    }
  }

  process.on('message', (message: ParentToChild) => {
    void (async () => {
      verbose(`[${config.role}] received ${message.kind}`)
      switch (message.kind) {
        case 'cache:populate':
          await cache.resolve(sessionCacheKey(message.sessionId), () =>
            Promise.resolve({ username: message.username, roles: [] }),
          )
          return
        case 'cache:query':
          send({ kind: 'cache:size', correlationId: message.correlationId, size: cache.size })
          return
        case 'identity:publish':
          await identityBus.publish(message.event)
          return
        case 'entity:subscribe': {
          const subscription = bus.subscribe(ENTITY_TOPIC, (busMessage) => {
            send({
              kind: 'entity:received',
              seq: busMessage.seq ?? '',
              payload: busMessage.payload,
              originId: busMessage.originId,
            })
          })
          await bus.whenReady(ENTITY_TOPIC)
          send({ kind: 'subscription:ready', correlationId: message.correlationId })
          // Subscription survives until the worker exits; let the IPC channel own its lifetime.
          void subscription
          return
        }
        case 'entity:publish':
          await bus.publish(ENTITY_TOPIC, message.payload)
          return
        case 'foreign:subscribe': {
          const foreign = bus.subscribeForeign(message.prefix, IDENTITY_EVENT_TOPIC, (busMessage) => {
            send({ kind: 'foreign:received', payload: busMessage.payload, originId: busMessage.originId })
          })
          await bus.whenReady(IDENTITY_EVENT_TOPIC, message.prefix)
          send({ kind: 'subscription:ready', correlationId: message.correlationId })
          void foreign
          return
        }
        case 'shutdown':
          await injector[Symbol.asyncDispose]()
          if (client.isOpen) await client.quit()
          process.exit(0)
        // ESLint default-case rule wants an explicit no-op fallthrough; the
        // switch above is already exhaustive against `ParentToChild`.
        // eslint-disable-next-line no-fallthrough -- exhaustive cases above
        default:
          return
      }
    })().catch((error) => {
      send({ kind: 'log', line: `[${config.role}] handler crashed: ${(error as Error).stack ?? String(error)}` })
    })
  })

  send({ kind: 'ready', role: config.role })
}

// ─────────────────────────────────────────────────────────────────────────────
// Child-mode entry point — runs when this file is executed by `fork(...)`
// from a parent test. Returns early so the `describe` block below never
// registers tests in the child process.
// ─────────────────────────────────────────────────────────────────────────────

const isChildMode = process.argv[2] === 'child'

if (isChildMode) {
  const role = process.argv[3] as NodeRole | undefined
  const topicPrefix = process.argv[4]
  if (!role || !topicPrefix) {
    process.stderr.write('cross-process-smoke child requires <role> <topicPrefix>\n')
    process.exit(1)
  } else {
    const resumeFromSeq = process.env[RESUME_FROM_ENV]
    runChild({ role, topicPrefix, resumeFromSeq }).catch((error: unknown) => {
      process.stderr.write(`child crashed: ${(error as Error).stack ?? String(error)}\n`)
      process.exit(1)
    })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Parent / vitest-side helpers and tests.
// ─────────────────────────────────────────────────────────────────────────────

type Worker = {
  role: NodeRole
  child: ChildProcess
  topicPrefix: string
  inbox: ChildToParent[]
  receive: (predicate: (message: ChildToParent) => boolean, timeoutMs?: number) => Promise<ChildToParent>
}

/**
 * The compiled-output path of this file. Children must execute the `.js`
 * Node can load directly; the source `.ts` is only valid for vite-node /
 * vitest's transformer in the parent worker.
 */
const COMPILED_SPEC_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'esm', 'cross-process-smoke.spec.js')

const forkWorker = (config: ServiceConfig): Worker => {
  const inbox: ChildToParent[] = []
  const listeners = new Set<(message: ChildToParent) => void>()

  const child = fork(COMPILED_SPEC_PATH, ['child', config.role, config.topicPrefix], {
    env: {
      ...process.env,
      ...(config.resumeFromSeq ? { [RESUME_FROM_ENV]: config.resumeFromSeq } : {}),
    },
  })

  child.on('message', (message) => {
    const typed = message as ChildToParent
    if (typed.kind === 'log') verbose(typed.line)
    else verbose(`[parent←${config.role}] ${typed.kind}`)
    inbox.push(typed)
    for (const listener of listeners) listener(typed)
  })

  child.on('exit', (code) => verbose(`[${config.role}] exited code=${code ?? 'null'}`))

  const receive = (predicate: (message: ChildToParent) => boolean, timeoutMs = 5000): Promise<ChildToParent> => {
    const matched = inbox.find(predicate)
    if (matched) return Promise.resolve(matched)
    return new Promise((resolveReceive, reject) => {
      const timer = setTimeout(() => {
        listeners.delete(handler)
        reject(new Error(`Timed out after ${timeoutMs}ms waiting on ${config.role}`))
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

  return { role: config.role, child, topicPrefix: config.topicPrefix, inbox, receive }
}

const sendToWorker = (worker: Worker, message: ParentToChild): void => {
  worker.child.send(message)
}

const queryCacheSize = async (worker: Worker): Promise<number> => {
  const correlationId = randomUUID()
  sendToWorker(worker, { kind: 'cache:query', correlationId })
  const response = (await worker.receive(
    (message) => message.kind === 'cache:size' && message.correlationId === correlationId,
  )) as Extract<ChildToParent, { kind: 'cache:size' }>
  return response.size
}

const drainEntityReceive = async (
  worker: Worker,
  predicate: (event: Extract<ChildToParent, { kind: 'entity:received' }>) => boolean,
  timeoutMs = 5000,
): Promise<Extract<ChildToParent, { kind: 'entity:received' }>> =>
  (await worker.receive((message) => message.kind === 'entity:received' && predicate(message), timeoutMs)) as Extract<
    ChildToParent,
    { kind: 'entity:received' }
  >

const shutdownWorker = async (worker: Worker): Promise<void> => {
  if (worker.child.exitCode !== null) return
  sendToWorker(worker, { kind: 'shutdown' })
  await new Promise<void>((resolveExit) => {
    if (worker.child.exitCode !== null) resolveExit()
    else worker.child.once('exit', () => resolveExit())
  })
}

const cleanupStreams = async (prefixes: readonly string[]): Promise<void> => {
  const client = createClient({ url: REDIS_URL })
  try {
    await client.connect()
    for (const prefix of prefixes) {
      await client.del(`${prefix}${IDENTITY_EVENT_TOPIC}`)
      await client.del(`${prefix}${ENTITY_TOPIC}`)
    }
  } catch {
    // Redis unreachable; the test that needs it will fail loudly and the
    // sweep is best-effort.
  } finally {
    if (client.isOpen) await client.quit()
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

const waitFor = async (predicate: () => Promise<boolean>, timeoutMs: number): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await predicate()) return
    await sleep(50)
  }
  throw new Error(`waitFor: timed out after ${timeoutMs}ms`)
}

if (!isChildMode) {
  describe('cross-process smoke (PRD M4)', () => {
    let prefixA: string
    let prefixB: string
    let activeWorkers: Worker[] = []

    const fork_ = (config: ServiceConfig): Worker => {
      const worker = forkWorker(config)
      activeWorkers.push(worker)
      return worker
    }

    const awaitReady = async (...workers: Worker[]): Promise<void> => {
      await Promise.all(workers.map((worker) => worker.receive((message) => message.kind === 'ready')))
    }

    beforeEach(() => {
      prefixA = `xp-a-${randomUUID().slice(0, 8)}/`
      prefixB = `xp-b-${randomUUID().slice(0, 8)}/`
      activeWorkers = []
    })

    afterEach(async () => {
      await Promise.all(activeWorkers.map(shutdownWorker))
      activeWorkers = []
      await cleanupStreams([prefixA, prefixB])
    }, 10_000)

    it('identity logout invalidates own service, leaves the other service alone', async () => {
      const a1 = fork_({ role: 'a1', topicPrefix: prefixA })
      const a2 = fork_({ role: 'a2', topicPrefix: prefixA })
      const b1 = fork_({ role: 'b1', topicPrefix: prefixB })
      const b2 = fork_({ role: 'b2', topicPrefix: prefixB })
      await awaitReady(a1, a2, b1, b2)

      const sessionId = `sess-${randomUUID().slice(0, 8)}`
      for (const worker of [a1, a2, b1, b2]) {
        sendToWorker(worker, { kind: 'cache:populate', sessionId, username: 'alice' })
      }
      for (const worker of [a1, a2, b1, b2]) {
        expect(await queryCacheSize(worker)).toBe(1)
      }

      sendToWorker(a1, { kind: 'identity:publish', event: { type: 'userLoggedOut', sessionId } })

      await waitFor(async () => (await queryCacheSize(a2)) === 0, 3000)
      expect(await queryCacheSize(a1)).toBe(0)
      expect(await queryCacheSize(b1)).toBe(1)
      expect(await queryCacheSize(b2)).toBe(1)
    }, 15_000)

    it('entity-sync publish on a1 reaches a2 with bus-stamped seq', async () => {
      const a1 = fork_({ role: 'a1', topicPrefix: prefixA })
      const a2 = fork_({ role: 'a2', topicPrefix: prefixA })
      await awaitReady(a1, a2)

      const subscriptionId = randomUUID()
      sendToWorker(a2, { kind: 'entity:subscribe', correlationId: subscriptionId })
      await a2.receive((message) => message.kind === 'subscription:ready' && message.correlationId === subscriptionId)

      sendToWorker(a1, {
        kind: 'entity:publish',
        payload: { type: 'updated', id: 'alice', change: { displayName: 'Alice' } },
      })

      const event = await drainEntityReceive(
        a2,
        (message) =>
          (message.payload as { id?: string }).id === 'alice' &&
          (message.payload as { change?: { displayName?: string } }).change?.displayName === 'Alice',
      )
      expect(event.seq).toBeTruthy()
      expect(event.originId).toBe('a1')
    }, 15_000)

    it('replay closes the gap after a2 dies and respawns with lastSeq', async () => {
      const a1 = fork_({ role: 'a1', topicPrefix: prefixA })
      let a2 = fork_({ role: 'a2', topicPrefix: prefixA })
      await awaitReady(a1, a2)

      const subscriptionId = randomUUID()
      sendToWorker(a2, { kind: 'entity:subscribe', correlationId: subscriptionId })
      await a2.receive((message) => message.kind === 'subscription:ready' && message.correlationId === subscriptionId)

      // Establish lastSeq with a single live publish — the bus stamps the
      // monotonic id we'll resume from after `a2` dies.
      sendToWorker(a1, { kind: 'entity:publish', payload: { type: 'updated', id: 'seed', change: { v: 0 } } })
      const seed = await drainEntityReceive(a2, (message) => (message.payload as { id?: string }).id === 'seed')
      const lastSeq = seed.seq
      expect(lastSeq).toBeTruthy()

      await shutdownWorker(a2)

      for (let index = 0; index < 5; index += 1) {
        sendToWorker(a1, {
          kind: 'entity:publish',
          payload: { type: 'updated', id: `gap-${index}`, change: { v: index } },
        })
      }
      // Give Redis a beat to apply the writes before the respawn reads them.
      await sleep(250)

      a2 = fork_({ role: 'a2', topicPrefix: prefixA, resumeFromSeq: lastSeq })
      await a2.receive((message) => message.kind === 'ready')
      const logLine = a2.inbox.find((message) => message.kind === 'log' && message.line.includes('replay yielded'))
      expect(logLine).toBeDefined()
      if (!logLine || logLine.kind !== 'log') throw new Error('unreachable — assertion above guarantees presence')
      const matched = /replay yielded (\d+) entries/.exec(logLine.line)
      expect(matched).not.toBeNull()
      const replayed = matched ? Number(matched[1]) : 0
      expect(replayed).toBeGreaterThanOrEqual(5)
    }, 15_000)

    it('subscribeForeign delivers svc-A identity events to b1 when opted in', async () => {
      const a1 = fork_({ role: 'a1', topicPrefix: prefixA })
      const b1 = fork_({ role: 'b1', topicPrefix: prefixB })
      await awaitReady(a1, b1)

      const subscriptionId = randomUUID()
      sendToWorker(b1, { kind: 'foreign:subscribe', prefix: prefixA, correlationId: subscriptionId })
      await b1.receive((message) => message.kind === 'subscription:ready' && message.correlationId === subscriptionId)

      const sessionId = `foreign-${randomUUID().slice(0, 8)}`
      sendToWorker(a1, { kind: 'identity:publish', event: { type: 'userLoggedOut', sessionId } })

      const received = (await b1.receive(
        (message) =>
          message.kind === 'foreign:received' && (message.payload as { sessionId?: string }).sessionId === sessionId,
        5000,
      )) as Extract<ChildToParent, { kind: 'foreign:received' }>
      expect(received.originId).toBe('a1')
    }, 15_000)
  })
}
