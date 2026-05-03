import { describe, expect, it, vi } from 'vitest'
import { ReplayWindowExceededError } from './errors.js'
import { MemoryBroker } from './memory-broker.js'
import type { BusMessage } from './types.js'

const collect = async (iterable: AsyncIterable<BusMessage>): Promise<BusMessage[]> => {
  const out: BusMessage[] = []
  for await (const message of iterable) out.push(message)
  return out
}

describe('MemoryBroker', () => {
  describe('constructor', () => {
    it('rejects non-positive replayWindow', () => {
      expect(() => new MemoryBroker({ replayWindow: 0 })).toThrow(RangeError)
      expect(() => new MemoryBroker({ replayWindow: -1 })).toThrow(RangeError)
      expect(() => new MemoryBroker({ replayWindow: 1.5 })).toThrow(RangeError)
    })

    it('exposes the configured replayWindow', () => {
      const broker = new MemoryBroker({ replayWindow: 42 })
      expect(broker.replayWindow).toBe(42)
    })

    it('defaults replayWindow to 1000', () => {
      const broker = new MemoryBroker()
      expect(broker.replayWindow).toBe(1000)
    })
  })

  describe('publish + subscribe', () => {
    it('delivers messages to every subscriber on the topic', () => {
      using broker = new MemoryBroker()
      const a = vi.fn()
      const b = vi.fn()
      using _subA = broker.subscribe('topic', a)
      using _subB = broker.subscribe('topic', b)

      const message = broker.publish('topic', 'origin-1', { x: 1 })

      expect(a).toHaveBeenCalledTimes(1)
      expect(b).toHaveBeenCalledTimes(1)
      expect(a.mock.calls[0]?.[0]).toBe(message)
    })

    it('does not deliver across topics', () => {
      using broker = new MemoryBroker()
      const handler = vi.fn()
      using _sub = broker.subscribe('topic-a', handler)

      broker.publish('topic-b', 'origin-1', null)
      expect(handler).not.toHaveBeenCalled()
    })

    it('stamps version, originId, payload, ISO emittedAt and monotonic seq', () => {
      using broker = new MemoryBroker()
      const m1 = broker.publish('topic', 'origin-1', { n: 1 })
      const m2 = broker.publish('topic', 'origin-2', { n: 2 })

      expect(m1.v).toBe(1)
      expect(m1.originId).toBe('origin-1')
      expect(m1.payload).toEqual({ n: 1 })
      expect(m1.seq).toBe('1')
      expect(m2.seq).toBe('2')
      expect(Number.isFinite(Date.parse(m1.emittedAt))).toBe(true)
    })

    it('keeps sequence counters per-topic', () => {
      using broker = new MemoryBroker()
      const a1 = broker.publish('a', 'o', null)
      const b1 = broker.publish('b', 'o', null)
      const a2 = broker.publish('a', 'o', null)

      expect(a1.seq).toBe('1')
      expect(b1.seq).toBe('1')
      expect(a2.seq).toBe('2')
    })

    it('removes the subscriber on dispose', () => {
      using broker = new MemoryBroker()
      const handler = vi.fn()
      const sub = broker.subscribe('topic', handler)
      sub[Symbol.dispose]()

      broker.publish('topic', 'origin-1', null)
      expect(handler).not.toHaveBeenCalled()
    })

    it('isolates one subscriber from another that throws', () => {
      using broker = new MemoryBroker()
      const ok = vi.fn()
      const onError = vi.fn()
      const failing = vi.fn(() => {
        throw new Error('boom')
      })
      using _subA = broker.subscribe('topic', failing)
      using _subB = broker.subscribe('topic', ok)

      broker.publish('topic', 'origin-1', null, onError)

      expect(ok).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error)
      expect(onError.mock.calls[0]?.[1]).toBe(failing)
    })

    it('falls back to console.error when no error sink is provided', () => {
      using broker = new MemoryBroker()
      const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      try {
        using _sub = broker.subscribe('topic', () => {
          throw new Error('boom')
        })
        broker.publish('topic', 'origin-1', null)
        expect(error).toHaveBeenCalledTimes(1)
      } finally {
        error.mockRestore()
      }
    })
  })

  describe('replay', () => {
    it('yields messages with seq greater than fromSeq', async () => {
      using broker = new MemoryBroker()
      broker.publish('topic', 'origin-1', { n: 1 })
      broker.publish('topic', 'origin-1', { n: 2 })
      broker.publish('topic', 'origin-1', { n: 3 })

      const yielded = await collect(broker.replay('topic', '1'))
      expect(yielded.map((m) => m.seq)).toEqual(['2', '3'])
    })

    it('returns an empty stream when nothing has been published', async () => {
      using broker = new MemoryBroker()
      const yielded = await collect(broker.replay('topic', '0'))
      expect(yielded).toEqual([])
    })

    it('returns an empty stream when fromSeq matches the latest seq', async () => {
      using broker = new MemoryBroker()
      broker.publish('topic', 'origin-1', null)
      const yielded = await collect(broker.replay('topic', '1'))
      expect(yielded).toEqual([])
    })

    it('throws synchronously when fromSeq falls outside the retained window', () => {
      const broker = new MemoryBroker({ replayWindow: 2 })
      try {
        broker.publish('topic', 'origin-1', null) // seq 1
        broker.publish('topic', 'origin-1', null) // seq 2
        broker.publish('topic', 'origin-1', null) // seq 3 — drops seq 1

        // window now retains seqs 2, 3. Asking from seq 0 lost seq 1.
        expect(() => broker.replay('topic', '0')).toThrow(ReplayWindowExceededError)
      } finally {
        broker[Symbol.dispose]()
      }
    })

    it('does not throw when fromSeq+1 equals the oldest retained seq', async () => {
      using broker = new MemoryBroker({ replayWindow: 2 })
      broker.publish('topic', 'origin-1', null) // seq 1
      broker.publish('topic', 'origin-1', null) // seq 2
      broker.publish('topic', 'origin-1', null) // seq 3 — retains 2, 3

      const yielded = await collect(broker.replay('topic', '1'))
      expect(yielded.map((m) => m.seq)).toEqual(['2', '3'])
    })

    it('rejects malformed fromSeq values', () => {
      using broker = new MemoryBroker()
      expect(() => broker.replay('topic', 'abc')).toThrow(RangeError)
      expect(() => broker.replay('topic', '-1')).toThrow(RangeError)
    })

    it('snapshots the buffer at call time', async () => {
      using broker = new MemoryBroker()
      broker.publish('topic', 'origin-1', { n: 1 })
      const iterable = broker.replay('topic', '0')
      broker.publish('topic', 'origin-1', { n: 2 })

      const yielded = await collect(iterable)
      expect(yielded.map((m) => (m.payload as { n: number }).n)).toEqual([1])
    })
  })

  describe('oldestSeq', () => {
    it('returns undefined when nothing has been published', () => {
      using broker = new MemoryBroker()
      expect(broker.oldestSeq('topic')).toBeUndefined()
    })

    it('returns the seq of the first retained message', () => {
      using broker = new MemoryBroker()
      broker.publish('topic', 'origin-1', null)
      broker.publish('topic', 'origin-1', null)
      expect(broker.oldestSeq('topic')).toBe('1')
    })

    it('advances after the ring buffer evicts older entries', () => {
      using broker = new MemoryBroker({ replayWindow: 2 })
      broker.publish('topic', 'origin-1', null) // seq 1, evicted
      broker.publish('topic', 'origin-1', null) // seq 2
      broker.publish('topic', 'origin-1', null) // seq 3
      expect(broker.oldestSeq('topic')).toBe('2')
    })
  })

  describe('onEviction', () => {
    it('fires once per shifted message with topic, evictedSeq, and retainedCount', () => {
      const evictions: Array<{ topic: string; evictedSeq: string; retainedCount: number }> = []
      using broker = new MemoryBroker({
        replayWindow: 2,
        onEviction: (topic, evictedSeq, retainedCount) => {
          evictions.push({ topic, evictedSeq, retainedCount })
        },
      })
      broker.publish('topic', 'origin-1', null) // seq 1
      broker.publish('topic', 'origin-1', null) // seq 2
      expect(evictions).toEqual([])
      broker.publish('topic', 'origin-1', null) // seq 3 → evicts seq 1
      broker.publish('topic', 'origin-1', null) // seq 4 → evicts seq 2
      expect(evictions).toEqual([
        { topic: 'topic', evictedSeq: '1', retainedCount: 2 },
        { topic: 'topic', evictedSeq: '2', retainedCount: 2 },
      ])
    })

    it('does not fire while the buffer is below replayWindow', () => {
      const onEviction = vi.fn()
      using broker = new MemoryBroker({ replayWindow: 5, onEviction })
      for (let i = 0; i < 5; i += 1) broker.publish('topic', 'origin-1', null)
      expect(onEviction).not.toHaveBeenCalled()
    })

    it('attributes evictions to the right topic when several are active', () => {
      const evictions: Array<{ topic: string; evictedSeq: string }> = []
      using broker = new MemoryBroker({
        replayWindow: 1,
        onEviction: (topic, evictedSeq) => {
          evictions.push({ topic, evictedSeq })
        },
      })
      broker.publish('a', 'origin-1', null) // seq a/1
      broker.publish('b', 'origin-1', null) // seq b/1
      broker.publish('a', 'origin-1', null) // evicts a/1
      broker.publish('b', 'origin-1', null) // evicts b/1
      expect(evictions).toEqual([
        { topic: 'a', evictedSeq: '1' },
        { topic: 'b', evictedSeq: '1' },
      ])
    })
  })

  describe('disposal', () => {
    it('clears subscribers and rejects further calls', () => {
      const broker = new MemoryBroker()
      const handler = vi.fn()
      broker.subscribe('topic', handler)

      broker[Symbol.dispose]()

      expect(() => broker.publish('topic', 'origin-1', null)).toThrow(/disposed/)
      expect(() => broker.subscribe('topic', handler)).toThrow(/disposed/)
      expect(() => broker.replay('topic', '0')).toThrow(/disposed/)
      expect(() => broker.oldestSeq('topic')).toThrow(/disposed/)
    })

    it('is idempotent', () => {
      const broker = new MemoryBroker()
      broker[Symbol.dispose]()
      expect(() => broker[Symbol.dispose]()).not.toThrow()
    })

    it('disposing a subscription after broker disposal is a no-op', () => {
      const broker = new MemoryBroker()
      const sub = broker.subscribe('topic', () => undefined)
      broker[Symbol.dispose]()
      expect(() => sub[Symbol.dispose]()).not.toThrow()
    })
  })
})
