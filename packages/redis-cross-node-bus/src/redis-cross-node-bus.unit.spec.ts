import { CrossNodeBusTelemetry } from '@furystack/cross-node-bus'
import { usingAsync } from '@furystack/utils'
import type { createClient } from 'redis'
import { describe, expect, it, vi } from 'vitest'
import { RedisCrossNodeBus } from './redis-cross-node-bus.js'

type RedisClient = ReturnType<typeof createClient>

type StubOverrides = {
  xAdd?: (...args: unknown[]) => Promise<unknown>
  xRange?: (...args: unknown[]) => Promise<unknown>
  xRead?: (...args: unknown[]) => Promise<unknown>
  xInfoStream?: (...args: unknown[]) => Promise<unknown>
  connect?: () => Promise<unknown>
  quit?: () => Promise<unknown>
  destroy?: () => void
  isOpen?: boolean
  duplicate?: () => RedisClient
}

const makeClient = (overrides: StubOverrides = {}): RedisClient => {
  const fake = {
    isOpen: overrides.isOpen ?? true,
    connect: overrides.connect ?? vi.fn(() => Promise.resolve(undefined)),
    quit: overrides.quit ?? vi.fn(() => Promise.resolve('OK')),
    destroy: overrides.destroy ?? vi.fn(() => undefined),
    xAdd: overrides.xAdd ?? vi.fn(() => Promise.resolve('1700000000000-0')),
    xRange: overrides.xRange ?? vi.fn(() => Promise.resolve([])),
    xRead: overrides.xRead ?? vi.fn(() => Promise.resolve(null)),
    xInfoStream: overrides.xInfoStream ?? vi.fn(() => Promise.resolve({})),
    duplicate: overrides.duplicate ?? (() => makeClient()),
  }
  return fake as unknown as RedisClient
}

describe('RedisCrossNodeBus (unit)', () => {
  describe('constructor validation', () => {
    it('throws when serviceName is empty', () => {
      expect(() => new RedisCrossNodeBus({ client: makeClient(), serviceName: '' })).toThrow(/serviceName/)
    })

    it('throws when replayWindow is not a positive integer', () => {
      expect(() => new RedisCrossNodeBus({ client: makeClient(), serviceName: 's', replayWindow: 0 })).toThrow(
        RangeError,
      )
      expect(() => new RedisCrossNodeBus({ client: makeClient(), serviceName: 's', replayWindow: -1 })).toThrow(
        RangeError,
      )
      expect(() => new RedisCrossNodeBus({ client: makeClient(), serviceName: 's', replayWindow: 1.5 })).toThrow(
        RangeError,
      )
    })

    it('defaults nodeId to ${serviceName}-${random} when not provided', () => {
      using bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc-a' })
      expect(bus.nodeId.startsWith('svc-a-')).toBe(true)
      expect(bus.nodeId.length).toBeGreaterThan('svc-a-'.length)
    })

    it('honors caller-supplied nodeId', () => {
      using bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc-a', nodeId: 'fixed' })
      expect(bus.nodeId).toBe('fixed')
    })

    it('declares persistent + replay + assignsSequence capabilities', () => {
      using bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc-a' })
      expect(bus.capabilities).toEqual({
        persistent: true,
        replay: true,
        assignsSequence: true,
        crossNodeDelivery: true,
      })
    })

    it('duplicates the supplied client and connects the duplicate', async () => {
      const duplicateConnect = vi.fn(() => Promise.resolve(undefined))
      const dup = makeClient({ isOpen: false, connect: duplicateConnect })
      const baseClient = makeClient({ duplicate: () => dup })
      using _bus = new RedisCrossNodeBus({ client: baseClient, serviceName: 'svc-a' })
      await Promise.resolve()
      expect(duplicateConnect).toHaveBeenCalledTimes(1)
    })
  })

  describe('publish', () => {
    it('serializes the payload as a single XADD field with MAXLEN ~ replayWindow', async () => {
      const xAdd = vi.fn(() => Promise.resolve('1-0'))
      using bus = new RedisCrossNodeBus({
        client: makeClient({ xAdd }),
        serviceName: 'svc-a',
        nodeId: 'svc-a-node',
        topicPrefix: 'svc-a/',
        replayWindow: 500,
      })
      await bus.publish('events', { hi: 'there' })
      expect(xAdd).toHaveBeenCalledTimes(1)
      const call = xAdd.mock.calls[0] as unknown as [
        string,
        string,
        Record<string, string>,
        { TRIM: Record<string, unknown> },
      ]
      expect(call[0]).toBe('svc-a/events')
      expect(call[1]).toBe('*')
      const message = call[2]
      expect(message.v).toBe('1')
      expect(message.originId).toBe('svc-a-node')
      expect(typeof message.emittedAt).toBe('string')
      expect(JSON.parse(message.payload)).toEqual({ hi: 'there' })
      expect(call[3].TRIM).toEqual({ strategy: 'MAXLEN', strategyModifier: '~', threshold: 500 })
    })

    it('encodes undefined payload as JSON null', async () => {
      const xAdd = vi.fn(() => Promise.resolve('1-0'))
      using bus = new RedisCrossNodeBus({ client: makeClient({ xAdd }), serviceName: 'svc' })
      await bus.publish('events', undefined)
      const message = (xAdd.mock.calls[0] as unknown as [string, string, Record<string, string>])[2]
      expect(message.payload).toBe('null')
    })

    it('emits onCrossNodePublished with byteLength after a successful publish', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        using bus = new RedisCrossNodeBus({
          client: makeClient(),
          serviceName: 'svc',
          nodeId: 'svc-1',
          telemetry,
        })
        const events: Array<{ topic: string; originId: string; byteLength: number }> = []
        using _sub = telemetry.subscribe('onCrossNodePublished', (event) => {
          events.push(event)
        })
        await bus.publish('events', { hi: 'there' })
        expect(events).toEqual([
          { topic: 'events', originId: 'svc-1', byteLength: Buffer.byteLength(JSON.stringify({ hi: 'there' })) },
        ])
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeError with phase=serialize and rethrows when JSON.stringify throws', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        using bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc', telemetry })
        const errors: Array<{ phase: string }> = []
        using _sub = telemetry.subscribe('onCrossNodeError', (event) => {
          errors.push(event)
        })
        const cycle: Record<string, unknown> = {}
        cycle.self = cycle
        await expect(bus.publish('events', cycle)).rejects.toThrow()
        expect(errors.some((e) => e.phase === 'serialize')).toBe(true)
      } finally {
        telemetry[Symbol.dispose]()
      }
    })

    it('emits onCrossNodeError with phase=publish and rethrows when xAdd rejects', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        const xAdd = vi.fn(() => Promise.reject(new Error('redis down')))
        using bus = new RedisCrossNodeBus({ client: makeClient({ xAdd }), serviceName: 'svc', telemetry })
        const errors: Array<{ phase: string }> = []
        using _sub = telemetry.subscribe('onCrossNodeError', (event) => {
          errors.push(event)
        })
        await expect(bus.publish('events', null)).rejects.toThrow(/redis down/)
        expect(errors.some((e) => e.phase === 'publish')).toBe(true)
      } finally {
        telemetry[Symbol.dispose]()
      }
    })
  })

  describe('replay', () => {
    // The synchronous ReplayWindowExceededError branch is exercised by the
    // Redis-backed integration spec, which is the only place the
    // oldest-seq cache can be primed without reaching into private fields.

    it('emits onCrossNodeError with phase=replay when xRange rejects mid-iteration', async () => {
      const telemetry = new CrossNodeBusTelemetry()
      try {
        const xRange = vi.fn(() => Promise.reject(new Error('xrange boom')))
        using bus = new RedisCrossNodeBus({ client: makeClient({ xRange }), serviceName: 'svc', telemetry })
        const errors: Array<{ phase: string }> = []
        using _sub = telemetry.subscribe('onCrossNodeError', (event) => {
          errors.push(event)
        })
        const iterable = bus.replay('events', '0-0')
        await expect(
          (async () => {
            for await (const _ of iterable) {
              void _
            }
          })(),
        ).rejects.toThrow(/xrange boom/)
        expect(errors.some((e) => e.phase === 'replay')).toBe(true)
      } finally {
        telemetry[Symbol.dispose]()
      }
    })
  })

  describe('compareSeq', () => {
    it('orders Redis stream ids by ms then seq', () => {
      using bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc' })
      expect(bus.compareSeq('1-0', '2-0')).toBeLessThan(0)
      expect(bus.compareSeq('1-1', '1-0')).toBeGreaterThan(0)
      expect(bus.compareSeq('9-0', '10-0')).toBeLessThan(0)
      expect(bus.compareSeq('5-5', '5-5')).toBe(0)
    })
  })

  describe('oldestSeq', () => {
    it('returns undefined before any subscribe / publish', () => {
      using bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc' })
      expect(bus.oldestSeq('topic')).toBeUndefined()
    })

    it('throws after dispose', () => {
      const bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc' })
      bus[Symbol.dispose]()
      expect(() => bus.oldestSeq('topic')).toThrow(/disposed/)
    })
  })

  describe('disposal', () => {
    it('rejects publish/subscribe/replay after dispose', async () => {
      const bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc' })
      bus[Symbol.dispose]()
      expect(() => bus.subscribe('topic', () => undefined)).toThrow(/disposed/)
      expect(() => bus.subscribeForeign('p/', 'topic', () => undefined)).toThrow(/disposed/)
      expect(() => bus.replay('topic', '0-0')).toThrow(/disposed/)
      await expect(bus.publish('topic', null)).rejects.toThrow(/disposed/)
    })

    it('is idempotent', () => {
      const bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc' })
      bus[Symbol.dispose]()
      expect(() => bus[Symbol.dispose]()).not.toThrow()
    })

    it('asyncDispose is idempotent and quits the duplicated read client when open', async () => {
      const dupQuit = vi.fn(() => Promise.resolve('OK'))
      const dup = makeClient({ isOpen: true, quit: dupQuit })
      const baseClient = makeClient({ duplicate: () => dup })
      await usingAsync(new RedisCrossNodeBus({ client: baseClient, serviceName: 'svc' }), async (bus) => {
        await bus[Symbol.asyncDispose]()
        expect(dupQuit).toHaveBeenCalledTimes(1)
      })
      // The wrapper's finally calls asyncDispose a second time; idempotency
      // means dupQuit still fired only once.
      expect(dupQuit).toHaveBeenCalledTimes(1)
    })

    it('asyncDispose tolerates a quit that rejects', async () => {
      const dup = makeClient({ isOpen: true, quit: vi.fn(() => Promise.reject(new Error('quit boom'))) })
      const baseClient = makeClient({ duplicate: () => dup })
      await usingAsync(new RedisCrossNodeBus({ client: baseClient, serviceName: 'svc' }), async (bus) => {
        await expect(bus[Symbol.asyncDispose]()).resolves.toBeUndefined()
      })
    })
  })

  describe('whenReady', () => {
    it('resolves immediately for topics that were never subscribed', async () => {
      using bus = new RedisCrossNodeBus({ client: makeClient(), serviceName: 'svc' })
      await expect(bus.whenReady('topic')).resolves.toBeUndefined()
    })
  })
})
