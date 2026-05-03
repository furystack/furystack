import { createInjector } from '@furystack/inject'
import { describe, expect, it, vi } from 'vitest'
import { CrossNodeBusTelemetry, CrossNodeBusTelemetryToken } from './cross-node-bus-telemetry.js'

describe('CrossNodeBusTelemetryToken', () => {
  it('resolves a CrossNodeBusTelemetry instance', async () => {
    await using injector = createInjector()
    const telemetry = injector.get(CrossNodeBusTelemetryToken)
    expect(telemetry).toBeInstanceOf(CrossNodeBusTelemetry)
  })

  it('disposes the telemetry instance with the injector scope', async () => {
    const injector = createInjector()
    const telemetry = injector.get(CrossNodeBusTelemetryToken)
    const handler = vi.fn()
    telemetry.addListener('onCrossNodePublished', handler)
    await injector[Symbol.asyncDispose]()

    telemetry.emit('onCrossNodePublished', { topic: 'x', originId: 'y', byteLength: 0 })
    expect(handler).not.toHaveBeenCalled()
  })

  it('shares the singleton instance across child scopes', async () => {
    await using injector = createInjector()
    await using scopeA = injector.createScope({ owner: 'a' })
    await using scopeB = injector.createScope({ owner: 'b' })

    const telA = scopeA.get(CrossNodeBusTelemetryToken)
    const telB = scopeB.get(CrossNodeBusTelemetryToken)

    expect(telA).toBe(telB)
  })

  it('issues independent instances per root injector', () => {
    const a = createInjector()
    const b = createInjector()
    try {
      expect(a.get(CrossNodeBusTelemetryToken)).not.toBe(b.get(CrossNodeBusTelemetryToken))
    } finally {
      void a[Symbol.asyncDispose]()
      void b[Symbol.asyncDispose]()
    }
  })
})
