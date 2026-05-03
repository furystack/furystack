import { createInjector } from '@furystack/inject'
import { describe, expect, it, vi } from 'vitest'
import { CrossNodeBus } from './cross-node-bus.js'
import { CrossNodeBusTelemetryToken } from './cross-node-bus-telemetry.js'
import { defineInProcessCrossNodeBus } from './define-in-process-cross-node-bus.js'
import { InProcessCrossNodeBus } from './in-process-cross-node-bus.js'

describe('CrossNodeBus token', () => {
  it('resolves an InProcessCrossNodeBus by default', async () => {
    await using injector = createInjector()
    const bus = injector.get(CrossNodeBus)
    expect(bus).toBeInstanceOf(InProcessCrossNodeBus)
  })

  it('disposes the bus when the injector scope tears down', async () => {
    const injector = createInjector()
    const bus = injector.get(CrossNodeBus)
    await injector[Symbol.asyncDispose]()
    expect(() => bus.subscribe('topic', () => undefined)).toThrow(/disposed/)
  })

  it('honors override bindings via defineInProcessCrossNodeBus', async () => {
    await using injector = createInjector()
    injector.bind(CrossNodeBus, defineInProcessCrossNodeBus({ nodeId: 'svc-a-1', topicPrefix: 'svc-a/' }))

    const bus = injector.get(CrossNodeBus)
    expect(bus.nodeId).toBe('svc-a-1')
  })

  it('publishes drive the scoped CrossNodeBusTelemetryToken', async () => {
    await using injector = createInjector()
    const telemetry = injector.get(CrossNodeBusTelemetryToken)
    const handler = vi.fn()
    using _sub = telemetry.subscribe('onCrossNodePublished', handler)

    const bus = injector.get(CrossNodeBus)
    await bus.publish('topic', { hi: 'there' })

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
