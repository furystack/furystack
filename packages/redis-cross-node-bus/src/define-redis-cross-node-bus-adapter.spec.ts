import { CrossNodeBus, CrossNodeBusTelemetryToken } from '@furystack/cross-node-bus'
import { createInjector } from '@furystack/inject'
import type { createClient } from 'redis'
import { describe, expect, it, vi } from 'vitest'
import { defineRedisCrossNodeBusAdapter } from './define-redis-cross-node-bus-adapter.js'
import { RedisCrossNodeBus } from './redis-cross-node-bus.js'

type RedisClient = ReturnType<typeof createClient>

const stubClient = (): RedisClient => {
  const fake = {
    isOpen: true,
    connect: vi.fn(() => Promise.resolve(undefined)),
    quit: vi.fn(() => Promise.resolve('OK')),
    destroy: vi.fn(() => undefined),
    xAdd: vi.fn(() => Promise.resolve('1-0')),
    xRange: vi.fn(() => Promise.resolve([])),
    xRead: vi.fn(() => Promise.resolve(null)),
    xInfoStream: vi.fn(() => Promise.resolve({})),
    duplicate: () => stubClient(),
  }
  return fake as unknown as RedisClient
}

describe('defineRedisCrossNodeBusAdapter', () => {
  it('binds a RedisCrossNodeBus override that resolves through the CrossNodeBus token', async () => {
    await using injector = createInjector()
    injector.bind(
      CrossNodeBus,
      defineRedisCrossNodeBusAdapter({
        client: stubClient(),
        serviceName: 'test-service',
        nodeId: 'fixed-node',
      }),
    )
    const bus = injector.get(CrossNodeBus)
    expect(bus).toBeInstanceOf(RedisCrossNodeBus)
    expect(bus.nodeId).toBe('fixed-node')
    expect(bus.capabilities).toEqual({ persistent: true, replay: true, assignsSequence: true })
  })

  it('disposes the bus when the injector tears down', async () => {
    const injector = createInjector()
    injector.bind(
      CrossNodeBus,
      defineRedisCrossNodeBusAdapter({
        client: stubClient(),
        serviceName: 'test-service',
        nodeId: 'fixed-node',
      }),
    )
    const bus = injector.get(CrossNodeBus)
    await injector[Symbol.asyncDispose]()
    expect(() => bus.subscribe('topic', () => undefined)).toThrow(/disposed/)
  })

  it('shares the scoped CrossNodeBusTelemetryToken with the adapter', async () => {
    await using injector = createInjector()
    injector.bind(
      CrossNodeBus,
      defineRedisCrossNodeBusAdapter({
        client: stubClient(),
        serviceName: 'test-service',
        nodeId: 'fixed-node',
      }),
    )
    const telemetry = injector.get(CrossNodeBusTelemetryToken)
    const events: Array<{ topic: string; originId: string }> = []
    using _sub = telemetry.subscribe('onCrossNodePublished', (event) => {
      events.push({ topic: event.topic, originId: event.originId })
    })
    const bus = injector.get(CrossNodeBus)
    await bus.publish('events', { hi: 'there' })
    expect(events).toEqual([{ topic: 'events', originId: 'fixed-node' }])
  })
})
