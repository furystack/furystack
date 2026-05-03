import type { User } from '@furystack/core'
import { CrossNodeBus, type BusMessage } from '@furystack/cross-node-bus'
import { createInjector, type Injector } from '@furystack/inject'
import { IDENTITY_EVENT_TOPIC, IdentityEventBus, sessionCacheKey, UserResolutionCache } from '@furystack/rest-service'
import { randomUUID } from 'node:crypto'
import { createClient } from 'redis'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineRedisCrossNodeBusAdapter } from './define-redis-cross-node-bus-adapter.js'
import { RedisCrossNodeBus } from './redis-cross-node-bus.js'

/**
 * PRD Milestone 5: multi-service smoke test.
 *
 * Two services × two nodes each, single Redis, distinct `topicPrefix` per
 * service. Same-process by design — every node is its own injector with its
 * own Redis client and bus, which exercises the full DI + adapter wiring
 * apps use in production. Cross-process isolation only adds proof that V8
 * matches injector isolation, which is uninteresting.
 *
 * Gated on a reachable Redis at `REDIS_URL` (default `redis://localhost:6379`),
 * matching the adapter integration spec and `@furystack/redis-store`.
 */

const redisUrl = process?.env?.REDIS_URL || 'redis://localhost:6379'

/**
 * Sample count for the §4 success-metric assertions. 100 publishes give a
 * stable p95/p99 against local Redis (~2-5 ms per round) without ballooning
 * test runtime past a couple of seconds.
 */
const METRIC_SAMPLES = 100

/** §4: p95 publish→receive lag against local Redis. */
const P95_LAG_BUDGET_MS = 50

/** §4: p99 logout→remote-cache-invalidation. Bus latency, not the 30 s TTL. */
const P99_STALENESS_BUDGET_MS = 1000

const userOf = (username: string, roles: readonly string[] = []): User => ({ username, roles: [...roles] })

const populateCache = async (cache: UserResolutionCache, sessionId: string, user: User): Promise<void> => {
  await cache.resolve(sessionCacheKey(sessionId), async () => user)
}

const waitFor = async (predicate: () => boolean, timeoutMs = 2000, intervalMs = 25): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('waitFor: timed out')
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}

const percentile = (sortedAsc: readonly number[], p: number): number => {
  if (sortedAsc.length === 0) return Number.NaN
  const rank = Math.ceil((p / 100) * sortedAsc.length) - 1
  const clamped = Math.max(0, Math.min(sortedAsc.length - 1, rank))
  return sortedAsc[clamped] ?? Number.NaN
}

/**
 * One node = one injector, one Redis client, one bus, one identity facade.
 * The injector tear-down disposes the bus (via `defineRedisCrossNodeBusAdapter`'s
 * `onDispose`); we close the client ourselves afterward.
 */
type ServiceNode = {
  injector: Injector
  bus: RedisCrossNodeBus
  cache: UserResolutionCache
  identityBus: IdentityEventBus
  client: ReturnType<typeof createClient>
  [Symbol.asyncDispose]: () => Promise<void>
}

const setupNode = async (options: {
  serviceName: string
  topicPrefix: string
  nodeId: string
}): Promise<ServiceNode> => {
  const client = createClient({ url: redisUrl })
  await client.connect()
  const injector = createInjector()
  injector.bind(
    CrossNodeBus,
    defineRedisCrossNodeBusAdapter({
      client,
      serviceName: options.serviceName,
      topicPrefix: options.topicPrefix,
      nodeId: options.nodeId,
    }),
  )
  const bus = injector.get(CrossNodeBus)
  if (!(bus instanceof RedisCrossNodeBus)) {
    throw new Error('expected RedisCrossNodeBus binding from defineRedisCrossNodeBusAdapter')
  }
  const cache = injector.get(UserResolutionCache)
  const identityBus = injector.get(IdentityEventBus)
  // The identity facade subscribes to `IDENTITY_EVENT_TOPIC` synchronously
  // in its constructor, but the Redis adapter's cursor init is async — wait
  // before any publish so sibling nodes do not miss the message.
  await bus.whenReady(IDENTITY_EVENT_TOPIC)
  return {
    injector,
    bus,
    cache,
    identityBus,
    client,
    [Symbol.asyncDispose]: async () => {
      await injector[Symbol.asyncDispose]()
      if (client.isOpen) await client.quit()
    },
  }
}

/** Ordered cleanup: tear down every node, then DEL the wire-level streams. */
const teardownNetwork = async (network: { nodes: ServiceNode[]; wireTopics: string[] }): Promise<void> => {
  for (const node of network.nodes) {
    await node[Symbol.asyncDispose]()
  }
  const cleanup = createClient({ url: redisUrl })
  try {
    await cleanup.connect()
    await Promise.all(network.wireTopics.map((key) => cleanup.del(key)))
  } catch {
    // Redis unreachable; per-test setup will fail loudly instead.
  } finally {
    if (cleanup.isOpen) await cleanup.quit()
  }
}

describe('multi-service smoke test (PRD M5)', () => {
  let prefixA: string
  let prefixB: string
  let wireTopics: string[]

  beforeEach(() => {
    // Per-test prefixes so tests against the same broker do not pollute each
    // other's streams. The IDENTITY_EVENT_TOPIC string is fixed on the
    // facade; isolation lives entirely in the wire-level prefix.
    prefixA = `svc-a-${randomUUID()}/`
    prefixB = `svc-b-${randomUUID()}/`
    wireTopics = [`${prefixA}${IDENTITY_EVENT_TOPIC}`, `${prefixB}${IDENTITY_EVENT_TOPIC}`]
  })

  describe('PRD §M5 assertions', () => {
    it('identity events from svc-A invalidate caches on every node of svc-A and only there', async () => {
      const a1 = await setupNode({ serviceName: 'svc-a', topicPrefix: prefixA, nodeId: 'a1' })
      const a2 = await setupNode({ serviceName: 'svc-a', topicPrefix: prefixA, nodeId: 'a2' })
      const b1 = await setupNode({ serviceName: 'svc-b', topicPrefix: prefixB, nodeId: 'b1' })
      const b2 = await setupNode({ serviceName: 'svc-b', topicPrefix: prefixB, nodeId: 'b2' })
      try {
        await populateCache(a1.cache, 's1', userOf('alice'))
        await populateCache(a2.cache, 's1', userOf('alice'))
        await populateCache(b1.cache, 's1', userOf('alice'))
        await populateCache(b2.cache, 's1', userOf('alice'))
        expect([a1.cache.size, a2.cache.size, b1.cache.size, b2.cache.size]).toEqual([1, 1, 1, 1])

        await a1.identityBus.publish({ type: 'userLoggedOut', sessionId: 's1' })

        // a1 invalidates inline; a2 receives over the bus; b1/b2 must not see it.
        await waitFor(() => a2.cache.size === 0)
        expect(a1.cache.size).toBe(0)
        expect(a2.cache.size).toBe(0)
        expect(b1.cache.size).toBe(1)
        expect(b2.cache.size).toBe(1)
      } finally {
        await teardownNetwork({ nodes: [a1, a2, b1, b2], wireTopics })
      }
    })

    it('service B sees nothing on its own subscriptions when service A publishes', async () => {
      const a1 = await setupNode({ serviceName: 'svc-a', topicPrefix: prefixA, nodeId: 'a1' })
      const b1 = await setupNode({ serviceName: 'svc-b', topicPrefix: prefixB, nodeId: 'b1' })
      const b2 = await setupNode({ serviceName: 'svc-b', topicPrefix: prefixB, nodeId: 'b2' })
      try {
        const onB1: string[] = []
        const onB2: string[] = []
        using _b1Sub = b1.identityBus.subscribe('userRolesChanged', (event) => onB1.push(event.username))
        using _b2Sub = b2.identityBus.subscribe('userRolesChanged', (event) => onB2.push(event.username))

        // Publish on svc-A and prove cross-service isolation by also publishing
        // on svc-B in the same test — the latter is what svc-B should see.
        await a1.identityBus.publish({ type: 'userRolesChanged', username: 'from-a' })
        await b1.identityBus.publish({ type: 'userRolesChanged', username: 'from-b' })

        // Wait for the legitimate svc-B delivery to land on b2; if cross-service
        // leakage were possible, the svc-A event would have arrived by the
        // same deadline.
        await waitFor(() => onB2.length >= 1)
        expect(onB1).toEqual(['from-b'])
        expect(onB2).toEqual(['from-b'])
      } finally {
        await teardownNetwork({ nodes: [a1, b1, b2], wireTopics })
      }
    })

    it('subscribeForeign from svc-B to svc-A delivers when explicitly opted in', async () => {
      const a1 = await setupNode({ serviceName: 'svc-a', topicPrefix: prefixA, nodeId: 'a1' })
      const b1 = await setupNode({ serviceName: 'svc-b', topicPrefix: prefixB, nodeId: 'b1' })
      try {
        const eavesdrop: BusMessage[] = []
        using _foreign = b1.bus.subscribeForeign(prefixA, IDENTITY_EVENT_TOPIC, (message) => {
          eavesdrop.push(message)
        })
        await b1.bus.whenReady(IDENTITY_EVENT_TOPIC, prefixA)

        await a1.identityBus.publish({ type: 'userDeleted', username: 'mallory' })

        await waitFor(() => eavesdrop.length === 1)
        expect(eavesdrop[0]?.originId).toBe('a1')
        expect(eavesdrop[0]?.payload).toEqual({ type: 'userDeleted', username: 'mallory' })
      } finally {
        await teardownNetwork({ nodes: [a1, b1], wireTopics })
      }
    })
  })

  describe('PRD §4 success metrics', () => {
    it(`p95 publish→receive lag < ${P95_LAG_BUDGET_MS} ms; p99 staleness < ${P99_STALENESS_BUDGET_MS} ms (${METRIC_SAMPLES} samples)`, async () => {
      const a1 = await setupNode({ serviceName: 'svc-a', topicPrefix: prefixA, nodeId: 'a1' })
      const a2 = await setupNode({ serviceName: 'svc-a', topicPrefix: prefixA, nodeId: 'a2' })
      try {
        // Lag = receivedAt − publishedAt, measured on a remote node (a2)
        // for an event published on a1. Captured directly on the wire so
        // we don't conflate facade dispatch overhead with transport cost.
        const lagsMs: number[] = []
        let received = 0
        using _wireSub = a2.bus.subscribeRemoteOnly(IDENTITY_EVENT_TOPIC, () => {
          received += 1
        })
        await a2.bus.whenReady(IDENTITY_EVENT_TOPIC)

        // Pre-seed cache entries so the staleness measurement has work to do.
        for (let i = 0; i < METRIC_SAMPLES; i += 1) {
          await populateCache(a2.cache, `m${i}`, userOf(`u-${i}`))
        }
        expect(a2.cache.size).toBe(METRIC_SAMPLES)

        for (let i = 0; i < METRIC_SAMPLES; i += 1) {
          const sessionId = `m${i}`
          const before = a2.cache.size
          const publishedAt = Date.now()
          await a1.identityBus.publish({ type: 'userLoggedOut', sessionId })
          // Staleness window = time from publish-on-a1 to cache-invalidation-on-a2.
          await waitFor(() => a2.cache.size === before - 1, P99_STALENESS_BUDGET_MS * 2)
          lagsMs.push(Date.now() - publishedAt)
        }

        await waitFor(() => received >= METRIC_SAMPLES, P99_STALENESS_BUDGET_MS * 2)

        const sorted = [...lagsMs].sort((x, y) => x - y)
        const p50 = percentile(sorted, 50)
        const p95 = percentile(sorted, 95)
        const p99 = percentile(sorted, 99)
        // "Recorded" per PRD §M5 — emit the percentiles so CI logs preserve them.
        console.log(
          `[M5 metrics] samples=${METRIC_SAMPLES} p50=${p50}ms p95=${p95}ms p99=${p99}ms ` +
            `min=${sorted[0]}ms max=${sorted[sorted.length - 1]}ms`,
        )

        expect(p95).toBeLessThan(P95_LAG_BUDGET_MS)
        expect(p99).toBeLessThan(P99_STALENESS_BUDGET_MS)
      } finally {
        await teardownNetwork({ nodes: [a1, a2], wireTopics })
      }
    }, 30_000)
  })
})
