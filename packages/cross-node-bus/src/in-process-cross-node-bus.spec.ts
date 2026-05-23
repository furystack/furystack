import { describe, expect, it, vi } from 'vitest'
import { CrossNodeBusTelemetry } from './cross-node-bus-telemetry.js'
import { ReplayWindowExceededError } from './errors.js'
import { InProcessCrossNodeBus } from './in-process-cross-node-bus.js'
import { MemoryBroker } from './memory-broker.js'
import type { BusMessage } from './types.js'

const collect = async (iterable: AsyncIterable<BusMessage>): Promise<BusMessage[]> => {
  const out: BusMessage[] = []
  for await (const message of iterable) out.push(message)
  return out
}

describe('InProcessCrossNodeBus', () => {
  describe('basics', () => {
    it('exposes a non-empty nodeId by default', () => {
      using bus = new InProcessCrossNodeBus()
      expect(typeof bus.nodeId).toBe('string')
      expect(bus.nodeId.length).toBeGreaterThan(0)
      expect(bus.nodeId.startsWith('local-')).toBe(true)
    })

    it('honors a caller-supplied nodeId', () => {
      using bus = new InProcessCrossNodeBus({ nodeId: 'fixed' })
      expect(bus.nodeId).toBe('fixed')
    })

    it('declares replay + assignsSequence capabilities and non-persistent', () => {
      using bus = new InProcessCrossNodeBus()
      expect(bus.capabilities).toEqual({
        persistent: false,
        replay: true,
        assignsSequence: true,
        crossNodeDelivery: false,
      })
    })
  })

  describe('publish + subscribe', () => {
    it('delivers self-published messages by default', async () => {
      using bus = new InProcessCrossNodeBus({ nodeId: 'self' })
      const handler = vi.fn()
      using _sub = bus.subscribe('topic', handler)

      await bus.publish('topic', { n: 1 })

      expect(handler).toHaveBeenCalledTimes(1)
      const message = handler.mock.calls[0]?.[0] as BusMessage
      expect(message.originId).toBe('self')
      expect(message.payload).toEqual({ n: 1 })
      expect(message.seq).toBe('1')
    })

    it('multiplexes a single broker subscription across local handlers', async () => {
      const broker = new MemoryBroker()
      const brokerSubscribe = vi.spyOn(broker, 'subscribe')
      try {
        using bus = new InProcessCrossNodeBus({ broker, nodeId: 'self' })
        using _a = bus.subscribe('topic', () => undefined)
        using _b = bus.subscribe('topic', () => undefined)
        using _c = bus.subscribe('topic', () => undefined)

        expect(brokerSubscribe).toHaveBeenCalledTimes(1)
      } finally {
        broker[Symbol.dispose]()
      }
    })

    it('releases the broker subscription when the last local handler disposes', async () => {
      using broker = new MemoryBroker()
      using bus = new InProcessCrossNodeBus({ broker, nodeId: 'self' })
      const handler = vi.fn()

      const sub = bus.subscribe('topic', handler)
      sub[Symbol.dispose]()
      await bus.publish('topic', null)
      expect(handler).not.toHaveBeenCalled()

      const handler2 = vi.fn()
      using _sub2 = bus.subscribe('topic', handler2)
      await bus.publish('topic', null)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('isolates one local handler error from another and from the bus', async () => {
      using bus = new InProcessCrossNodeBus({ nodeId: 'self' })
      const ok = vi.fn()
      using _failing = bus.subscribe('topic', () => {
        throw new Error('boom')
      })
      using _ok = bus.subscribe('topic', ok)

      await expect(bus.publish('topic', null)).resolves.toBeUndefined()
      expect(ok).toHaveBeenCalledTimes(1)
    })

    it('subscribeRemoteOnly skips messages originating on this node', async () => {
      using broker = new MemoryBroker()
      using busA = new InProcessCrossNodeBus({ broker, nodeId: 'a' })
      using busB = new InProcessCrossNodeBus({ broker, nodeId: 'b' })
      const handler = vi.fn()
      using _sub = busA.subscribeRemoteOnly('topic', handler)

      await busA.publish('topic', { from: 'a' })
      await busB.publish('topic', { from: 'b' })

      expect(handler).toHaveBeenCalledTimes(1)
      expect((handler.mock.calls[0]?.[0] as BusMessage).originId).toBe('b')
    })
  })

  describe('topicPrefix + subscribeForeign', () => {
    it('prefixes topics on the wire and isolates buses with different prefixes', async () => {
      using broker = new MemoryBroker()
      using svcA = new InProcessCrossNodeBus({ broker, nodeId: 'a', topicPrefix: 'svc-a/' })
      using svcB = new InProcessCrossNodeBus({ broker, nodeId: 'b', topicPrefix: 'svc-b/' })
      const onA = vi.fn()
      const onB = vi.fn()
      using _subA = svcA.subscribe('events', onA)
      using _subB = svcB.subscribe('events', onB)

      await svcA.publish('events', { from: 'a' })

      expect(onA).toHaveBeenCalledTimes(1)
      expect(onB).not.toHaveBeenCalled()
    })

    it('subscribeForeign delivers messages from a foreign prefix on demand', async () => {
      using broker = new MemoryBroker()
      using svcA = new InProcessCrossNodeBus({ broker, nodeId: 'a', topicPrefix: 'svc-a/' })
      using svcB = new InProcessCrossNodeBus({ broker, nodeId: 'b', topicPrefix: 'svc-b/' })
      const eavesdrop = vi.fn()
      using _foreign = svcB.subscribeForeign('svc-a/', 'events', eavesdrop)

      await svcA.publish('events', { from: 'a' })

      expect(eavesdrop).toHaveBeenCalledTimes(1)
      expect((eavesdrop.mock.calls[0]?.[0] as BusMessage).originId).toBe('a')
    })
  })

  describe('replay', () => {
    it('yields messages newer than fromSeq', async () => {
      using bus = new InProcessCrossNodeBus({ nodeId: 'a' })
      await bus.publish('topic', { n: 1 })
      await bus.publish('topic', { n: 2 })
      await bus.publish('topic', { n: 3 })

      const yielded = await collect(bus.replay('topic', '1'))
      expect(yielded.map((m) => (m.payload as { n: number }).n)).toEqual([2, 3])
    })

    it('throws ReplayWindowExceededError when fromSeq is too old', () => {
      const bus = new InProcessCrossNodeBus({ replayWindow: 2 })
      try {
        void bus.publish('topic', null)
        void bus.publish('topic', null)
        void bus.publish('topic', null)
        expect(() => bus.replay('topic', '0')).toThrow(ReplayWindowExceededError)
      } finally {
        bus[Symbol.dispose]()
      }
    })
  })

  describe('telemetry', () => {
    it('emits onCrossNodePublished with byteLength after a successful publish', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        using bus = new InProcessCrossNodeBus({ nodeId: 'a', telemetry })
        const events: Array<{ topic: string; originId: string; byteLength: number }> = []
        using _sub = telemetry.subscribe('onCrossNodePublished', (event) => {
          events.push(event)
        })

        await bus.publish('topic', { hi: 'there' })

        expect(events).toEqual([
          { topic: 'topic', originId: 'a', byteLength: Buffer.byteLength(JSON.stringify({ hi: 'there' })) },
        ])
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeReceived once per arrival regardless of handler count', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        using bus = new InProcessCrossNodeBus({ nodeId: 'a', telemetry })
        const arrivals = vi.fn()
        using _sub = telemetry.subscribe('onCrossNodeReceived', arrivals)
        using _h1 = bus.subscribe('topic', () => undefined)
        using _h2 = bus.subscribe('topic', () => undefined)
        using _h3 = bus.subscribe('topic', () => undefined)

        await bus.publish('topic', null)
        expect(arrivals).toHaveBeenCalledTimes(1)
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeError with phase=subscribe when a local handler throws', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        using bus = new InProcessCrossNodeBus({ nodeId: 'a', telemetry })
        const errors: Array<{ phase: string; topic: string; error: unknown }> = []
        using _sub = telemetry.subscribe('onCrossNodeError', (event) => {
          errors.push(event)
        })
        using _failing = bus.subscribe('topic', () => {
          throw new Error('boom')
        })

        await bus.publish('topic', null)
        expect(errors).toHaveLength(1)
        expect(errors[0]?.phase).toBe('subscribe')
        expect(errors[0]?.topic).toBe('topic')
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeError with phase=subscribe when a direct broker subscriber throws during fan-out', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      using broker = new MemoryBroker()
      try {
        using bus = new InProcessCrossNodeBus({ broker, nodeId: 'a', telemetry })
        const errors: Array<{ phase: string; topic: string }> = []
        using _sub = telemetry.subscribe('onCrossNodeError', (event) => {
          errors.push(event)
        })
        // A direct broker subscriber bypasses the bus's `#deliver` try/catch;
        // its throw routes through the broker's `onSubscriberError` sink.
        using _failing = broker.subscribe('topic', () => {
          throw new Error('boom')
        })

        await bus.publish('topic', null)
        expect(errors.some((event) => event.phase === 'subscribe' && event.topic === 'topic')).toBe(true)
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeError with phase=subscribe when broker.subscribe throws on first hookup', () => {
      const telemetry = new CrossNodeBusTelemetry()
      const broker = new MemoryBroker()
      try {
        using bus = new InProcessCrossNodeBus({ broker, nodeId: 'a', telemetry })
        const errors: Array<{ phase: string }> = []
        using _sub = telemetry.subscribe('onCrossNodeError', (event) => {
          errors.push(event)
        })
        broker[Symbol.dispose]()
        expect(() => bus.subscribe('topic', () => undefined)).toThrow(/disposed/)
        expect(errors.some((event) => event.phase === 'subscribe')).toBe(true)
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeError with phase=publish when the broker rejects publish', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      const broker = new MemoryBroker()
      try {
        using bus = new InProcessCrossNodeBus({ broker, nodeId: 'a', telemetry })
        const errors: Array<{ phase: string }> = []
        using _sub = telemetry.subscribe('onCrossNodeError', (event) => {
          errors.push(event)
        })
        broker[Symbol.dispose]()
        await expect(bus.publish('topic', null)).rejects.toThrow(/disposed/)
        expect(errors.some((event) => event.phase === 'publish')).toBe(true)
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeError with phase=replay when the underlying broker rejects', () => {
      const telemetry = new CrossNodeBusTelemetry()
      using broker = new MemoryBroker({ replayWindow: 1 })
      try {
        using bus = new InProcessCrossNodeBus({ broker, nodeId: 'a', telemetry })
        const errors: Array<{ phase: string }> = []
        using _sub = telemetry.subscribe('onCrossNodeError', (event) => {
          errors.push(event)
        })
        void bus.publish('topic', null)
        void bus.publish('topic', null)
        expect(() => bus.replay('topic', '0')).toThrow()
        expect(errors.some((event) => event.phase === 'replay')).toBe(true)
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeWindowEvicted with displayTopic when a private broker rolls', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        using bus = new InProcessCrossNodeBus({ nodeId: 'a', telemetry, replayWindow: 2 })
        const evictions: Array<{ topic: string; evictedSeq: string; retainedCount: number }> = []
        using _sub = telemetry.subscribe('onCrossNodeWindowEvicted', (event) => {
          evictions.push(event)
        })
        // No subscriber → displayTopic falls back to wire (= 'topic' here, no prefix)
        await bus.publish('topic', null) // seq 1
        await bus.publish('topic', null) // seq 2
        await bus.publish('topic', null) // seq 3 → evicts seq 1
        expect(evictions).toEqual([{ topic: 'topic', evictedSeq: '1', retainedCount: 2 }])
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('attributes window-evicted topic to the original subscribe call when topicPrefix is set', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        using bus = new InProcessCrossNodeBus({ nodeId: 'a', telemetry, replayWindow: 2, topicPrefix: 'svc-a/' })
        using _h = bus.subscribe('events', () => undefined)
        const evictions: Array<{ topic: string }> = []
        using _sub = telemetry.subscribe('onCrossNodeWindowEvicted', (event) => {
          evictions.push({ topic: event.topic })
        })
        await bus.publish('events', null)
        await bus.publish('events', null)
        await bus.publish('events', null) // first eviction
        expect(evictions).toEqual([{ topic: 'events' }])
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('does not emit onCrossNodeWindowEvicted when the broker is supplied externally', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      using broker = new MemoryBroker({ replayWindow: 2 })
      try {
        using bus = new InProcessCrossNodeBus({ broker, nodeId: 'a', telemetry })
        const onEvicted = vi.fn()
        using _sub = telemetry.subscribe('onCrossNodeWindowEvicted', onEvicted)
        await bus.publish('topic', null)
        await bus.publish('topic', null)
        await bus.publish('topic', null)
        expect(onEvicted).not.toHaveBeenCalled()
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeError with phase=serialize when JSON.stringify throws', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        using bus = new InProcessCrossNodeBus({ nodeId: 'a', telemetry })
        const errors: Array<{ phase: string }> = []
        using _sub = telemetry.subscribe('onCrossNodeError', (event) => {
          errors.push(event)
        })

        const cycle: Record<string, unknown> = {}
        cycle.self = cycle

        await bus.publish('topic', cycle)
        expect(errors.some((event) => event.phase === 'serialize')).toBe(true)
      } finally {
        telemetry[Symbol.dispose]()
      }
    })
  })

  describe('compareSeq', () => {
    it('returns negative, zero, positive for a<b, a==b, a>b', () => {
      using bus = new InProcessCrossNodeBus()
      expect(bus.compareSeq('1', '2')).toBeLessThan(0)
      expect(bus.compareSeq('5', '5')).toBe(0)
      expect(bus.compareSeq('10', '2')).toBeGreaterThan(0)
    })
  })

  describe('oldestSeq', () => {
    it('returns undefined before any publish', () => {
      using bus = new InProcessCrossNodeBus()
      expect(bus.oldestSeq('topic')).toBeUndefined()
    })

    it('returns the oldest retained seq honoring topicPrefix', async () => {
      using broker = new MemoryBroker()
      using bus = new InProcessCrossNodeBus({ broker, topicPrefix: 'svc/' })
      await bus.publish('topic', null)
      await bus.publish('topic', null)
      expect(bus.oldestSeq('topic')).toBe('1')
      // direct broker access proves the prefix was applied on the wire.
      expect(broker.oldestSeq('svc/topic')).toBe('1')
    })

    it('throws after dispose', () => {
      const bus = new InProcessCrossNodeBus()
      bus[Symbol.dispose]()
      expect(() => bus.oldestSeq('topic')).toThrow(/disposed/)
    })
  })

  describe('disposal', () => {
    it('rejects publish/subscribe/replay after dispose', async () => {
      const bus = new InProcessCrossNodeBus()
      bus[Symbol.dispose]()
      expect(() => bus.subscribe('topic', () => undefined)).toThrow(/disposed/)
      expect(() => bus.subscribeForeign('p/', 'topic', () => undefined)).toThrow(/disposed/)
      expect(() => bus.replay('topic', '0')).toThrow(/disposed/)
      await expect(bus.publish('topic', null)).rejects.toThrow(/disposed/)
    })

    it('is idempotent', () => {
      const bus = new InProcessCrossNodeBus()
      bus[Symbol.dispose]()
      expect(() => bus[Symbol.dispose]()).not.toThrow()
    })

    it('disposes its private broker when it owns one', () => {
      const bus = new InProcessCrossNodeBus()
      const handler = vi.fn()
      const sub = bus.subscribe('topic', handler)
      bus[Symbol.dispose]()
      expect(() => sub[Symbol.dispose]()).not.toThrow()
    })

    it('does not dispose a shared broker', () => {
      using broker = new MemoryBroker()
      const bus = new InProcessCrossNodeBus({ broker })
      bus[Symbol.dispose]()
      expect(() => broker.publish('topic', 'a', null)).not.toThrow()
    })
  })
})
