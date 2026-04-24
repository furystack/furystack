import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { ServerTelemetry, ServerTelemetryToken } from './server-telemetry.js'

describe('ServerTelemetry', () => {
  it('ServerTelemetryToken resolves to a ServerTelemetry EventHub and is cached per scope', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const a = injector.get(ServerTelemetryToken)
      const b = injector.get(ServerTelemetryToken)
      expect(a).toBe(b)
      expect(a).toBeInstanceOf(ServerTelemetry)
    })
  })

  it('Emitted events are dispatched to subscribers', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const telemetry = injector.get(ServerTelemetryToken)
      const onListening = vi.fn()
      telemetry.subscribe('onServerListening', onListening)
      telemetry.emit('onServerListening', { url: 'http://localhost:1', port: 1 })
      expect(onListening).toHaveBeenCalledWith({ url: 'http://localhost:1', port: 1 })
    })
  })

  it('Disposes cleanly with the injector and stops routing events', async () => {
    const injector = createInjector()
    const telemetry = injector.get(ServerTelemetryToken)
    const onClosed = vi.fn()
    telemetry.subscribe('onServerClosed', onClosed)

    await injector[Symbol.asyncDispose]()

    // After the owning injector is disposed, emit on the captured reference
    // should still work (the EventHub is disposed separately via onDispose,
    // but listeners are cleared). The key guarantee: previously-attached
    // listeners receive nothing new after dispose.
    telemetry.emit('onServerClosed', { url: 'http://localhost:2' })
    expect(onClosed).not.toHaveBeenCalled()
  })

  it('Scopes have isolated telemetry instances', async () => {
    await usingAsync(createInjector(), async (root) => {
      const scope1 = root.createScope()
      const scope2 = root.createScope()
      try {
        const t1 = scope1.get(ServerTelemetryToken)
        const t2 = scope2.get(ServerTelemetryToken)
        expect(t1).not.toBe(t2)
      } finally {
        await scope1[Symbol.asyncDispose]()
        await scope2[Symbol.asyncDispose]()
      }
    })
  })
})
