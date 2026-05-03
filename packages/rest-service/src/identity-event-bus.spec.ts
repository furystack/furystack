import type { User } from '@furystack/core'
import { CrossNodeBus, defineInProcessCrossNodeBus, type BusMessage } from '@furystack/cross-node-bus'
import { createInProcessBusNetwork } from '@furystack/cross-node-bus/testing'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import { describe, expect, it, vi } from 'vitest'
import { sessionCacheKey, userCacheTag } from './identity-cache-keys.js'
import {
  applyLocalIdentityInvalidation,
  IDENTITY_EVENT_TOPIC,
  IdentityEventBus,
  type IdentityEvent,
} from './identity-event-bus.js'
import { UserResolutionCache } from './user-resolution-cache.js'

const userOf = (username: string, roles: readonly string[] = []): User => ({ username, roles: [...roles] })

const populateCache = async (cache: UserResolutionCache, sessionId: string, user: User): Promise<void> => {
  await cache.resolve(sessionCacheKey(sessionId), async () => user)
}

describe('IdentityEventBus', () => {
  describe('applyLocalIdentityInvalidation', () => {
    it('invalidates by session id for `userLoggedOut`', async () => {
      await usingAsync(createInjector(), async (i) => {
        const cache = i.get(UserResolutionCache)
        await populateCache(cache, 's1', userOf('alice'))
        expect(cache.size).toBe(1)
        applyLocalIdentityInvalidation({ type: 'userLoggedOut', sessionId: 's1' }, cache)
        expect(cache.size).toBe(0)
      })
    })

    it('invalidates by session id for `sessionInvalidated`', async () => {
      await usingAsync(createInjector(), async (i) => {
        const cache = i.get(UserResolutionCache)
        await populateCache(cache, 's2', userOf('alice'))
        applyLocalIdentityInvalidation({ type: 'sessionInvalidated', sessionId: 's2' }, cache)
        expect(cache.size).toBe(0)
      })
    })

    for (const type of ['userRolesChanged', 'userDeleted', 'passwordChanged'] as const) {
      it(`invalidates every cached session for the named user on \`${type}\``, async () => {
        await usingAsync(createInjector(), async (i) => {
          const cache = i.get(UserResolutionCache)
          await populateCache(cache, 's-a-1', userOf('alice'))
          await populateCache(cache, 's-a-2', userOf('alice'))
          await populateCache(cache, 's-b-1', userOf('bob'))
          expect(cache.size).toBe(3)
          applyLocalIdentityInvalidation({ type, username: 'alice' }, cache)
          expect(cache.size).toBe(1)
          // The remaining entry is bob's.
          await populateCache(cache, 's-a-3', userOf('alice'))
          expect(cache.size).toBe(2)
        })
      })
    }
  })

  describe('publish', () => {
    it('invalidates the local cache synchronously before awaiting the bus', async () => {
      await usingAsync(createInjector(), async (i) => {
        const cache = i.get(UserResolutionCache)
        await populateCache(cache, 's1', userOf('alice'))
        const bus = i.get(IdentityEventBus)
        const pending = bus.publish({ type: 'userLoggedOut', sessionId: 's1' })
        // Local invalidation must already be visible — the bus.publish promise
        // is irrelevant for in-process correctness on the originating node.
        expect(cache.size).toBe(0)
        await pending
      })
    })

    it('fires local subscribers with the typed payload on every event variant', async () => {
      await usingAsync(createInjector(), async (i) => {
        const bus = i.get(IdentityEventBus)
        const events: IdentityEvent[] = []
        using _u = bus.subscribe('userLoggedOut', (event) => events.push(event))
        using _s = bus.subscribe('sessionInvalidated', (event) => events.push(event))
        using _r = bus.subscribe('userRolesChanged', (event) => events.push(event))
        using _d = bus.subscribe('userDeleted', (event) => events.push(event))
        using _p = bus.subscribe('passwordChanged', (event) => events.push(event))

        await bus.publish({ type: 'userLoggedOut', sessionId: 's1' })
        await bus.publish({ type: 'sessionInvalidated', sessionId: 's2' })
        await bus.publish({ type: 'userRolesChanged', username: 'alice' })
        await bus.publish({ type: 'userDeleted', username: 'bob' })
        await bus.publish({ type: 'passwordChanged', username: 'carol' })

        expect(events).toEqual([
          { type: 'userLoggedOut', sessionId: 's1' },
          { type: 'sessionInvalidated', sessionId: 's2' },
          { type: 'userRolesChanged', username: 'alice' },
          { type: 'userDeleted', username: 'bob' },
          { type: 'passwordChanged', username: 'carol' },
        ])
      })
    })

    it('does not fire subscribers for other event types', async () => {
      await usingAsync(createInjector(), async (i) => {
        const bus = i.get(IdentityEventBus)
        const handler = vi.fn()
        using _u = bus.subscribe('userLoggedOut', handler)

        await bus.publish({ type: 'sessionInvalidated', sessionId: 'x' })
        await bus.publish({ type: 'userRolesChanged', username: 'alice' })

        expect(handler).not.toHaveBeenCalled()
      })
    })

    it('rejects when called after dispose', async () => {
      const injector = createInjector()
      const bus = injector.get(IdentityEventBus)
      await injector[Symbol.asyncDispose]()
      await expect(bus.publish({ type: 'userLoggedOut', sessionId: 's1' })).rejects.toThrow(/disposed/)
    })

    it('publishes onto the underlying CrossNodeBus topic', async () => {
      await usingAsync(createInjector(), async (i) => {
        const crossNodeBus = i.get(CrossNodeBus)
        const wireHandler = vi.fn<(message: BusMessage) => void>()
        using _sub = crossNodeBus.subscribe(IDENTITY_EVENT_TOPIC, wireHandler)

        await i.get(IdentityEventBus).publish({ type: 'userRolesChanged', username: 'alice' })

        expect(wireHandler).toHaveBeenCalledTimes(1)
        expect(wireHandler.mock.calls[0][0].payload).toEqual({ type: 'userRolesChanged', username: 'alice' })
      })
    })
  })

  describe('subscribe', () => {
    it('returns a Disposable that removes the listener', async () => {
      await usingAsync(createInjector(), async (i) => {
        const bus = i.get(IdentityEventBus)
        const handler = vi.fn()
        const sub = bus.subscribe('userLoggedOut', handler)
        await bus.publish({ type: 'userLoggedOut', sessionId: 's1' })
        sub[Symbol.dispose]()
        await bus.publish({ type: 'userLoggedOut', sessionId: 's2' })
        expect(handler).toHaveBeenCalledTimes(1)
      })
    })

    it('isolates listener errors so peers still run', async () => {
      await usingAsync(createInjector(), async (i) => {
        const bus = i.get(IdentityEventBus)
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
        try {
          const peer = vi.fn()
          using _bad = bus.subscribe('userLoggedOut', () => {
            throw new Error('boom')
          })
          using _good = bus.subscribe('userLoggedOut', peer)

          await bus.publish({ type: 'userLoggedOut', sessionId: 's1' })

          expect(peer).toHaveBeenCalledTimes(1)
          expect(errorSpy).toHaveBeenCalled()
        } finally {
          errorSpy.mockRestore()
        }
      })
    })

    it('lets a handler dispose its own subscription mid-emit without skipping peers', async () => {
      await usingAsync(createInjector(), async (i) => {
        const bus = i.get(IdentityEventBus)
        const peer = vi.fn()
        let selfDispose: Disposable | null = null
        selfDispose = bus.subscribe('userLoggedOut', () => {
          selfDispose?.[Symbol.dispose]()
        })
        using _peer = bus.subscribe('userLoggedOut', peer)

        await bus.publish({ type: 'userLoggedOut', sessionId: 's1' })

        expect(peer).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('cross-node delivery', () => {
    it('logout on node A invalidates the cached session on node B', async () => {
      using network = createInProcessBusNetwork({ count: 2 })
      const [busA, busB] = network.buses
      await usingAsync(createInjector(), async (a) => {
        await usingAsync(createInjector(), async (b) => {
          a.bind(CrossNodeBus, defineInProcessCrossNodeBus({ broker: network.broker, nodeId: busA.nodeId }))
          b.bind(CrossNodeBus, defineInProcessCrossNodeBus({ broker: network.broker, nodeId: busB.nodeId }))

          const cacheA = a.get(UserResolutionCache)
          const cacheB = b.get(UserResolutionCache)
          await populateCache(cacheA, 's1', userOf('alice'))
          await populateCache(cacheB, 's1', userOf('alice'))

          // Force the bus singletons to materialise so subscriptions are live.
          const facadeA = a.get(IdentityEventBus)
          b.get(IdentityEventBus)

          await facadeA.publish({ type: 'userLoggedOut', sessionId: 's1' })

          expect(cacheA.size).toBe(0)
          expect(cacheB.size).toBe(0)
        })
      })
    })

    it('userRolesChanged on node A drops every alice entry on node B', async () => {
      using network = createInProcessBusNetwork({ count: 2 })
      const [busA, busB] = network.buses
      await usingAsync(createInjector(), async (a) => {
        await usingAsync(createInjector(), async (b) => {
          a.bind(CrossNodeBus, defineInProcessCrossNodeBus({ broker: network.broker, nodeId: busA.nodeId }))
          b.bind(CrossNodeBus, defineInProcessCrossNodeBus({ broker: network.broker, nodeId: busB.nodeId }))

          const cacheB = b.get(UserResolutionCache)
          await populateCache(cacheB, 's-a-1', userOf('alice'))
          await populateCache(cacheB, 's-a-2', userOf('alice'))
          await populateCache(cacheB, 's-b-1', userOf('bob'))
          a.get(IdentityEventBus)
          b.get(IdentityEventBus)

          await a.get(IdentityEventBus).publish({ type: 'userRolesChanged', username: 'alice' })

          expect(cacheB.size).toBe(1)
        })
      })
    })

    it('local subscribers on node A see the event before the bus broadcasts', async () => {
      using network = createInProcessBusNetwork({ count: 2 })
      const [busA, busB] = network.buses
      await usingAsync(createInjector(), async (a) => {
        await usingAsync(createInjector(), async (b) => {
          a.bind(CrossNodeBus, defineInProcessCrossNodeBus({ broker: network.broker, nodeId: busA.nodeId }))
          b.bind(CrossNodeBus, defineInProcessCrossNodeBus({ broker: network.broker, nodeId: busB.nodeId }))

          const order: string[] = []
          using _localA = a.get(IdentityEventBus).subscribe('userDeleted', () => order.push('A-local'))
          using _remoteB = b.get(IdentityEventBus).subscribe('userDeleted', () => order.push('B-remote'))

          await a.get(IdentityEventBus).publish({ type: 'userDeleted', username: 'bob' })

          // A-local fires synchronously inside `publish`; B-remote fires after
          // the bus accepts the message — same tick in-process, but ordering
          // is guaranteed by the publish path's local-first contract.
          expect(order).toEqual(['A-local', 'B-remote'])
        })
      })
    })

    it('drops malformed payloads received over the bus without invalidating the cache', async () => {
      using network = createInProcessBusNetwork({ count: 2 })
      const [busA, busB] = network.buses
      await usingAsync(createInjector(), async (a) => {
        await usingAsync(createInjector(), async (b) => {
          a.bind(CrossNodeBus, defineInProcessCrossNodeBus({ broker: network.broker, nodeId: busA.nodeId }))
          b.bind(CrossNodeBus, defineInProcessCrossNodeBus({ broker: network.broker, nodeId: busB.nodeId }))

          const cacheB = b.get(UserResolutionCache)
          await populateCache(cacheB, 's1', userOf('alice'))
          b.get(IdentityEventBus)
          a.get(IdentityEventBus)

          await a.get(CrossNodeBus).publish(IDENTITY_EVENT_TOPIC, { type: 'unknownEvent', sessionId: 's1' })
          await a.get(CrossNodeBus).publish(IDENTITY_EVENT_TOPIC, null)
          await a.get(CrossNodeBus).publish(IDENTITY_EVENT_TOPIC, { type: 'userLoggedOut' })

          expect(cacheB.size).toBe(1)
        })
      })
    })
  })

  describe('shared helpers', () => {
    it('exposes the cache-key shape used by the facade subscribers', () => {
      expect(sessionCacheKey('s1')).toBe('cookie:s1')
      expect(userCacheTag('alice')).toBe('user:alice')
    })
  })
})
