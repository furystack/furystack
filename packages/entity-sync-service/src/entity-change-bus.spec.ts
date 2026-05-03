import { CrossNodeBus, InProcessCrossNodeBus, MemoryBroker } from '@furystack/cross-node-bus'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { EntityChangeBus, topicForModel, type EntityChange, type EntityChangeEnvelope } from './entity-change-bus.js'

const collectFor = (count: number) => {
  const seen: EntityChangeEnvelope[] = []
  return {
    seen,
    handler: (env: EntityChangeEnvelope) => {
      seen.push(env)
    },
    waitFor: () =>
      new Promise<void>((resolve, reject) => {
        const start = Date.now()
        const tick = (): void => {
          if (seen.length >= count) return resolve()
          if (Date.now() - start > 1000) return reject(new Error(`waited > 1s for ${count} envelopes`))
          setTimeout(tick, 5)
        }
        tick()
      }),
  }
}

describe('EntityChangeBus', () => {
  describe('factory', () => {
    it('throws when bound bus lacks `replay` capability', async () => {
      await usingAsync(createInjector(), async (injector) => {
        injector.bind(CrossNodeBus, () => {
          const bus = new InProcessCrossNodeBus({ nodeId: 'fixed' })
          Object.defineProperty(bus, 'capabilities', {
            value: { persistent: false, replay: false, assignsSequence: true },
          })
          return bus
        })
        expect(() => injector.get(EntityChangeBus)).toThrow(/replay: true, assignsSequence: true/)
      })
    })

    it('throws when bound bus lacks `assignsSequence` capability', async () => {
      await usingAsync(createInjector(), async (injector) => {
        injector.bind(CrossNodeBus, () => {
          const bus = new InProcessCrossNodeBus({ nodeId: 'fixed' })
          Object.defineProperty(bus, 'capabilities', {
            value: { persistent: false, replay: true, assignsSequence: false },
          })
          return bus
        })
        expect(() => injector.get(EntityChangeBus)).toThrow(/replay: true, assignsSequence: true/)
      })
    })

    it('exposes the bound bus on the facade', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const facade = injector.get(EntityChangeBus)
        expect(facade.bus).toBe(injector.get(CrossNodeBus))
      })
    })
  })

  describe('topicForModel', () => {
    it('prefixes the model name with `entity/`', () => {
      expect(topicForModel('User')).toBe('entity/User')
      expect(topicForModel('Org/Team')).toBe('entity/Org/Team')
    })
  })

  describe('publish + subscribe', () => {
    it('delivers self-published changes with bus-stamped version + originId', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const facade = injector.get(EntityChangeBus)
        const { seen, handler, waitFor } = collectFor(1)
        using _sub = facade.subscribe('User', handler)
        await facade.publish('User', { type: 'added', entity: { id: 'a' }, primaryKey: 'a' })
        await waitFor()
        expect(seen).toHaveLength(1)
        expect(seen[0].modelName).toBe('User')
        expect(seen[0].change).toEqual({ type: 'added', entity: { id: 'a' }, primaryKey: 'a' })
        expect(seen[0].originId).toBe(facade.bus.nodeId)
        expect(typeof seen[0].version.seq).toBe('string')
        expect(typeof seen[0].version.timestamp).toBe('string')
      })
    })

    it('delivers each subscriber for the same model exactly once per publish', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const facade = injector.get(EntityChangeBus)
        const a = vi.fn()
        const b = vi.fn()
        using _a = facade.subscribe('User', a)
        using _b = facade.subscribe('User', b)
        await facade.publish('User', { type: 'updated', id: '1', change: { name: 'A' } })
        // Bus dispatch is synchronous on local handler invocation, but allow a microtask flush.
        await Promise.resolve()
        expect(a).toHaveBeenCalledTimes(1)
        expect(b).toHaveBeenCalledTimes(1)
      })
    })

    it('isolates models — a publish on one model does not wake another model handlers', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const facade = injector.get(EntityChangeBus)
        const onUser = vi.fn()
        const onPost = vi.fn()
        using _u = facade.subscribe('User', onUser)
        using _p = facade.subscribe('Post', onPost)
        await facade.publish('User', { type: 'removed', id: 'a' })
        expect(onUser).toHaveBeenCalledTimes(1)
        expect(onPost).not.toHaveBeenCalled()
      })
    })

    it('multiplexes a single bus subscription across N facade subscribers per model', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const facade = injector.get(EntityChangeBus)
        const subscribeSpy = vi.spyOn(facade.bus, 'subscribe')
        using _a = facade.subscribe('User', () => undefined)
        using _b = facade.subscribe('User', () => undefined)
        using _c = facade.subscribe('User', () => undefined)
        // Three facade-level subscribers, one underlying bus.subscribe call.
        expect(subscribeSpy).toHaveBeenCalledTimes(1)
      })
    })

    it('releases the underlying bus subscription when the last facade handler disposes', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const facade = injector.get(EntityChangeBus)
        const handler = vi.fn()
        const sub = facade.subscribe('User', handler)
        sub[Symbol.dispose]()
        await facade.publish('User', { type: 'removed', id: 'a' })
        expect(handler).not.toHaveBeenCalled()
      })
    })

    it('isolates one handler throw from peers', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const facade = injector.get(EntityChangeBus)
        const ok = vi.fn()
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        try {
          using _failing = facade.subscribe('User', () => {
            throw new Error('boom')
          })
          using _ok = facade.subscribe('User', ok)
          await facade.publish('User', { type: 'removed', id: 'a' })
          await Promise.resolve()
          expect(ok).toHaveBeenCalledTimes(1)
          expect(error).toHaveBeenCalled()
        } finally {
          error.mockRestore()
        }
      })
    })

    it('drops messages whose payload is not a recognised EntityChange', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const facade = injector.get(EntityChangeBus)
        const handler = vi.fn()
        using _sub = facade.subscribe('User', handler)
        // Bypass the typed publish to inject a foreign payload onto the wire.
        await facade.bus.publish(topicForModel('User'), { type: 'unknown' })
        await Promise.resolve()
        expect(handler).not.toHaveBeenCalled()
      })
    })
  })

  describe('cross-node delivery', () => {
    it('delivers a publish from bus A to subscribers on bus B sharing one MemoryBroker', async () => {
      using broker = new MemoryBroker()
      await usingAsync(createInjector(), async (injectorA) => {
        await usingAsync(createInjector(), async (injectorB) => {
          injectorA.bind(CrossNodeBus, () => new InProcessCrossNodeBus({ broker, nodeId: 'a' }))
          injectorB.bind(CrossNodeBus, () => new InProcessCrossNodeBus({ broker, nodeId: 'b' }))
          const facadeA = injectorA.get(EntityChangeBus)
          const facadeB = injectorB.get(EntityChangeBus)
          const onB: EntityChangeEnvelope[] = []
          using _sub = facadeB.subscribe('User', (env) => onB.push(env))

          await facadeA.publish('User', { type: 'added', entity: { id: '1' }, primaryKey: '1' })
          await Promise.resolve()

          expect(onB).toHaveLength(1)
          expect(onB[0].originId).toBe('a')
          expect(onB[0].change).toEqual({ type: 'added', entity: { id: '1' }, primaryKey: '1' })
        })
      })
    })
  })

  describe('disposal', () => {
    it('rejects publish/subscribe after dispose', async () => {
      const injector = createInjector()
      const facade = injector.get(EntityChangeBus)
      await injector[Symbol.asyncDispose]()
      await expect(facade.publish('User', { type: 'removed', id: '1' })).rejects.toThrow(/disposed/)
      expect(() => facade.subscribe('User', () => undefined)).toThrow(/disposed/)
    })
  })

  describe('change variants', () => {
    const variants: EntityChange[] = [
      { type: 'added', entity: { id: '1' }, primaryKey: '1' },
      { type: 'updated', id: '1', change: { name: 'A' } },
      { type: 'removed', id: '1' },
    ]
    it.each(variants)('round-trips %j', async (change) => {
      await usingAsync(createInjector(), async (injector) => {
        const facade = injector.get(EntityChangeBus)
        const seen: EntityChangeEnvelope[] = []
        using _sub = facade.subscribe('User', (env) => seen.push(env))
        await facade.publish('User', change)
        await Promise.resolve()
        expect(seen).toHaveLength(1)
        expect(seen[0].change).toEqual(change)
      })
    })
  })
})
