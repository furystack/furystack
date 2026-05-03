import { ReplayWindowExceededError, type BusMessage } from '@furystack/cross-node-bus'
import { usingAsync } from '@furystack/utils'
import { randomUUID } from 'node:crypto'
import { createClient } from 'redis'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RedisCrossNodeBus } from './redis-cross-node-bus.js'

const redisUrl = process?.env?.REDIS_URL || 'redis://localhost:6379'

const collect = async (iterable: AsyncIterable<BusMessage>): Promise<BusMessage[]> => {
  const out: BusMessage[] = []
  for await (const message of iterable) out.push(message)
  return out
}

const setupBus = async (
  options: { topicPrefix?: string; replayWindow?: number; nodeId?: string } = {},
): Promise<{
  bus: RedisCrossNodeBus
  client: ReturnType<typeof createClient>
  [Symbol.asyncDispose]: () => Promise<void>
}> => {
  const client = createClient({ url: redisUrl })
  await client.connect()
  const bus = new RedisCrossNodeBus({
    client,
    serviceName: 'redis-cross-node-bus-spec',
    nodeId: options.nodeId,
    topicPrefix: options.topicPrefix,
    replayWindow: options.replayWindow,
  })
  return {
    bus,
    client,
    [Symbol.asyncDispose]: async () => {
      await bus[Symbol.asyncDispose]()
      if (client.isOpen) await client.quit()
    },
  }
}

const waitFor = async (predicate: () => boolean, timeoutMs = 2000, intervalMs = 25): Promise<void> => {
  const deadline = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() > deadline) {
      throw new Error('waitFor: timed out')
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
}

describe('RedisCrossNodeBus (integration)', () => {
  let topic: string

  beforeEach(() => {
    // Per-test topic to keep streams isolated across runs against the same broker.
    topic = `spec-${randomUUID()}`
  })

  // Best-effort cleanup — DEL is cheap and tests use unique topic names.
  afterEach(async () => {
    const cleanup = createClient({ url: redisUrl })
    try {
      await cleanup.connect()
      await cleanup.del(topic)
    } catch {
      // Redis unreachable; the per-test setup will fail loudly instead.
    } finally {
      if (cleanup.isOpen) await cleanup.quit()
    }
  })

  describe('publish + subscribe', () => {
    it('delivers self-published messages with a Redis stream id as seq', async () => {
      await usingAsync(await setupBus({ nodeId: 'self' }), async ({ bus }) => {
        const received: BusMessage[] = []
        using _sub = bus.subscribe(topic, (message) => {
          received.push(message)
        })
        await bus.whenReady(topic)
        await bus.publish(topic, { n: 1 })
        await waitFor(() => received.length === 1)
        const [message] = received
        expect(message?.originId).toBe('self')
        expect(message?.payload).toEqual({ n: 1 })
        expect(message?.v).toBe(1)
        expect(message?.seq).toMatch(/^\d+-\d+$/)
      })
    })

    it('delivers messages between two buses sharing the same broker', async () => {
      await usingAsync(await setupBus({ nodeId: 'a' }), async (a) => {
        await usingAsync(await setupBus({ nodeId: 'b' }), async (b) => {
          const onB: BusMessage[] = []
          using _sub = b.bus.subscribe(topic, (message) => {
            onB.push(message)
          })
          await b.bus.whenReady(topic)
          await a.bus.publish(topic, { from: 'a' })
          await waitFor(() => onB.length === 1)
          expect(onB[0]?.originId).toBe('a')
          expect(onB[0]?.payload).toEqual({ from: 'a' })
        })
      })
    })

    it('subscribeRemoteOnly skips self-published messages', async () => {
      await usingAsync(await setupBus({ nodeId: 'a' }), async (a) => {
        await usingAsync(await setupBus({ nodeId: 'b' }), async (b) => {
          const onA: BusMessage[] = []
          using _sub = a.bus.subscribeRemoteOnly(topic, (message) => {
            onA.push(message)
          })
          await a.bus.whenReady(topic)
          await a.bus.publish(topic, { from: 'a' })
          await b.bus.publish(topic, { from: 'b' })
          await waitFor(() => onA.length === 1)
          expect(onA[0]?.originId).toBe('b')
        })
      })
    })

    it('isolates buses by topicPrefix and exposes cross-prefix via subscribeForeign', async () => {
      const prefixA = `svc-a-${randomUUID()}/`
      const prefixB = `svc-b-${randomUUID()}/`
      await usingAsync(await setupBus({ nodeId: 'a', topicPrefix: prefixA }), async (a) => {
        await usingAsync(await setupBus({ nodeId: 'b', topicPrefix: prefixB }), async (b) => {
          const onB: BusMessage[] = []
          const eavesdrop: BusMessage[] = []
          using _ownSub = b.bus.subscribe(topic, (message) => {
            onB.push(message)
          })
          using _foreignSub = b.bus.subscribeForeign(prefixA, topic, (message) => {
            eavesdrop.push(message)
          })
          await b.bus.whenReady(topic)
          await b.bus.whenReady(topic, prefixA)
          await a.bus.publish(topic, { from: 'a' })
          await waitFor(() => eavesdrop.length === 1)
          expect(eavesdrop[0]?.originId).toBe('a')
          // Cleanup: the prefixed wire keys are not the same as `topic`.
          await Promise.all([a.client.del(`${prefixA}${topic}`), b.client.del(`${prefixB}${topic}`)])
          expect(onB).toHaveLength(0)
        })
      })
    })

    it('multiplexes a single read connection across many local handlers on one wire', async () => {
      await usingAsync(await setupBus({ nodeId: 'a' }), async ({ bus }) => {
        const received: number[] = []
        using _h1 = bus.subscribe(topic, () => received.push(1))
        using _h2 = bus.subscribe(topic, () => received.push(2))
        using _h3 = bus.subscribe(topic, () => received.push(3))
        await bus.whenReady(topic)
        await bus.publish(topic, null)
        await waitFor(() => received.length === 3)
        expect(received.sort()).toEqual([1, 2, 3])
      })
    })
  })

  describe('replay', () => {
    it('yields messages strictly newer than fromSeq via XRANGE', async () => {
      await usingAsync(await setupBus({ nodeId: 'a' }), async ({ bus, client }) => {
        await bus.publish(topic, { n: 1 })
        await bus.publish(topic, { n: 2 })
        await bus.publish(topic, { n: 3 })
        // Look up the actual stream id of the first entry to use as fromSeq.
        const range = await client.xRange(topic, '-', '+', { COUNT: 1 })
        const firstId = range[0]?.id
        if (!firstId) throw new Error('expected at least one entry')
        const yielded = await collect(bus.replay(topic, firstId))
        expect(yielded.map((m) => (m.payload as { n: number }).n)).toEqual([2, 3])
      })
    })

    it('throws ReplayWindowExceededError when the cached oldest is newer than fromSeq', async () => {
      await usingAsync(await setupBus({ nodeId: 'a', replayWindow: 1 }), async ({ bus }) => {
        // Subscribing primes the oldest-seq cache. Publish a few messages so the
        // cache is populated with a real id, then try to replay from before genesis.
        const received: BusMessage[] = []
        using _sub = bus.subscribe(topic, (message) => received.push(message))
        await bus.whenReady(topic)
        await bus.publish(topic, { n: 1 })
        await waitFor(() => received.length === 1)
        // Now the oldestSeqCache holds the id of message n=1.
        // Requesting replay from '0-0' (older than that id) must throw sync.
        expect(() => bus.replay(topic, '0-0')).toThrow(ReplayWindowExceededError)
      })
    })

    it('returns an empty iterable when no messages are newer than fromSeq', async () => {
      await usingAsync(await setupBus({ nodeId: 'a' }), async ({ bus, client }) => {
        await bus.publish(topic, { n: 1 })
        const range = await client.xRange(topic, '-', '+', { COUNT: 1 })
        const lastId = range[range.length - 1]?.id
        if (!lastId) throw new Error('expected at least one entry')
        const yielded = await collect(bus.replay(topic, lastId))
        expect(yielded).toEqual([])
      })
    })
  })

  describe('compareSeq + oldestSeq', () => {
    it('compareSeq orders ids server-issued by Redis', async () => {
      await usingAsync(await setupBus({ nodeId: 'a' }), async ({ bus, client }) => {
        await bus.publish(topic, null)
        await bus.publish(topic, null)
        const range = await client.xRange(topic, '-', '+', { COUNT: 2 })
        const [first, second] = range
        if (!first || !second) throw new Error('expected two entries')
        expect(bus.compareSeq(first.id, second.id)).toBeLessThan(0)
        expect(bus.compareSeq(second.id, first.id)).toBeGreaterThan(0)
        expect(bus.compareSeq(first.id, first.id)).toBe(0)
      })
    })

    it('oldestSeq reflects the oldest delivered message after subscribe', async () => {
      await usingAsync(await setupBus({ nodeId: 'a' }), async ({ bus, client }) => {
        const received: BusMessage[] = []
        using _sub = bus.subscribe(topic, (message) => received.push(message))
        await bus.whenReady(topic)
        await bus.publish(topic, null)
        await waitFor(() => received.length === 1)
        const range = await client.xRange(topic, '-', '+', { COUNT: 1 })
        expect(bus.oldestSeq(topic)).toBe(range[0]?.id)
      })
    })
  })

  describe('whenReady', () => {
    it('lets subscribers reliably observe a publish issued immediately afterwards', async () => {
      await usingAsync(await setupBus({ nodeId: 'a' }), async ({ bus }) => {
        const received: BusMessage[] = []
        using _sub = bus.subscribe(topic, (message) => received.push(message))
        await bus.whenReady(topic)
        await bus.publish(topic, { ok: true })
        await waitFor(() => received.length === 1)
        expect(received[0]?.payload).toEqual({ ok: true })
      })
    })
  })
})
