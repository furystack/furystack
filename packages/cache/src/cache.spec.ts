import { using, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Cache } from './cache.js'
describe('Cache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be constructed and disposed', () => {
    using(new Cache({ load: () => Promise.resolve(1) }), () => {
      // Constructed and disposed automatically
    })
  })

  it('Should return values as observables', async () => {
    await usingAsync(new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) }), async (cache) => {
      const obs = cache.getObservable(1, 2)
      expect(obs.getValue().status).toEqual('loading')

      await vi.advanceTimersByTimeAsync(10)

      expect(obs.getValue().status).toEqual('loaded')
      expect(obs.getValue().value).toEqual(3)
    })
  })

  it('Should trigger loader only if the value is not in the cache when getting an observable', async () => {
    const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))
    await usingAsync(new Cache({ load: loader }), async (cache) => {
      const obs = cache.getObservable(1, 2)
      expect(obs.getValue().status).toEqual('loading')

      const result = await cache.get(1, 2)
      expect(result).toEqual(3)

      expect(obs.getValue().status).toEqual('loaded')

      const obs2 = cache.getObservable(1, 2)
      expect(obs2.getValue().status).toEqual('loaded')

      expect(loader).toHaveBeenCalledTimes(1)
    })
  })

  it('Should remove the oldest entry when capacity limit is reached', async () => {
    await usingAsync(
      new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), capacity: 2 }),
      async (cache) => {
        await cache.get(1, 2)
        await cache.get(1, 3)
        await cache.get(1, 4)
        expect(cache.getCount()).toEqual(2)
      },
    )
  })

  it('Should mark the value as obsolete after the stale time has passed', async () => {
    await usingAsync(
      new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), staleTimeMs: 100 }),
      async (cache) => {
        await cache.get(1, 2)
        await vi.advanceTimersByTimeAsync(200)
        const obs = cache.getObservable(1, 2)
        expect(obs.getValue().status).toEqual('obsolete')
      },
    )
  })

  it('Should swallow errors when stale time has passed and try to set stale state for a non-loaded value', async () => {
    await usingAsync(
      new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), staleTimeMs: 100 }),
      async (cache) => {
        await cache.get(1, 2)
        cache.remove(1, 2)
        await vi.advanceTimersByTimeAsync(200)
      },
    )
  })

  it('Should remove the value from the cache after the cache time has passed', async () => {
    await usingAsync(
      new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), cacheTimeMs: 100 }),
      async (cache) => {
        await cache.get(1, 2)
        cache.remove(1, 2)
        await vi.advanceTimersByTimeAsync(200)
        expect(cache.has(1, 2)).toEqual(false)
      },
    )
  })

  it('Should mark the value as obsolete after stale time has passed following a reload', async () => {
    await usingAsync(
      new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), staleTimeMs: 100 }),
      async (cache) => {
        await cache.get(1, 2)
        await cache.reload(1, 2)
        await vi.advanceTimersByTimeAsync(200)
        const obs = cache.getObservable(1, 2)
        expect(obs.getValue().status).toEqual('obsolete')
      },
    )
  })

  it('Should remove the value from the cache after cache time has passed following a reload', async () => {
    await usingAsync(
      new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), cacheTimeMs: 100 }),
      async (cache) => {
        await cache.get(1, 2)
        await cache.reload(1, 2)
        await vi.advanceTimersByTimeAsync(200)
        expect(cache.has(1, 2)).toEqual(false)
      },
    )
  })

  it('Should reset stale timer on reload so the old timer does not fire prematurely', async () => {
    await usingAsync(
      new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), staleTimeMs: 100 }),
      async (cache) => {
        await cache.get(1, 2)
        await vi.advanceTimersByTimeAsync(80)
        await cache.reload(1, 2)
        await vi.advanceTimersByTimeAsync(50)
        const obs = cache.getObservable(1, 2)
        expect(obs.getValue().status).toEqual('loaded')
      },
    )
  })

  it('Should reset cache time timer on reload so the old timer does not evict prematurely', async () => {
    await usingAsync(
      new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), cacheTimeMs: 100 }),
      async (cache) => {
        await cache.get(1, 2)
        await vi.advanceTimersByTimeAsync(80)
        await cache.reload(1, 2)
        await vi.advanceTimersByTimeAsync(50)
        expect(cache.has(1, 2)).toEqual(true)
      },
    )
  })

  it('Should remove value from the cache', async () => {
    await usingAsync(new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) }), async (cache) => {
      await cache.get(1, 2)
      await cache.get(1, 3)
      expect(cache.getCount()).toEqual(2)
      cache.remove(1, 2)
      expect(cache.getCount()).toEqual(1)
    })
  })

  it('Should remove all values from the cache', async () => {
    await usingAsync(new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) }), async (cache) => {
      await cache.get(1, 2)
      await cache.get(1, 3)
      expect(cache.getCount()).toEqual(2)
      cache.flushAll()
      expect(cache.getCount()).toEqual(0)
    })
  })

  it('Should set an explicit value', async () => {
    const load = vi.fn((a: number, b: number) => Promise.resolve(a + b))
    await usingAsync(new Cache({ load }), async (cache) => {
      cache.setExplicitValue({ loadArgs: [1, 2], value: { status: 'loaded', value: 3, updatedAt: new Date() } })
      expect(cache.getCount()).toEqual(1)

      const result = await cache.get(1, 2)
      expect(result).toEqual(3)
      expect(load).not.toHaveBeenCalled()
    })
  })

  describe('Loading, locking and reloading', () => {
    it('should store and retrieve results based on the arguments', async () => {
      const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        const result = await cache.get(1, 2)

        expect(result).toEqual(3)

        const result2 = await cache.get(1, 2)
        expect(result2).toEqual(3)

        expect(loader).toHaveBeenCalledTimes(1)

        const result3 = await cache.get(1, 3)
        expect(result3).toEqual(4)

        const result3_2 = await cache.get(1, 3)
        expect(result3_2).toEqual(4)

        expect(loader).toHaveBeenCalledTimes(2)
      })
    })

    it('Should return the cached value after the lock resolves', async () => {
      const loader = vi.fn(
        (a: number, b: number) =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve(a + b)
            }, 1000),
          ),
      )

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        const resultPromise = cache.get(1, 2)
        await vi.advanceTimersByTimeAsync(100)
        const result2Promise = cache.get(1, 2)
        await vi.advanceTimersByTimeAsync(1000)
        const result = await resultPromise
        const result2 = await result2Promise
        expect(result).toStrictEqual(result2)
        expect(result).toEqual(3)
        expect(loader).toHaveBeenCalledTimes(1)
      })
    })

    it('Should reload regardless of the already loaded state', async () => {
      const loader = vi.fn(
        (a: number, b: number) =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve(a + b)
            }, 1000),
          ),
      )

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        const resultPromise = cache.get(1, 2)
        await vi.advanceTimersByTimeAsync(1000)
        const result = await resultPromise
        const result2Promise = cache.reload(1, 2)
        await vi.advanceTimersByTimeAsync(1000)
        const result2 = await result2Promise
        expect(result).toStrictEqual(result2)
        expect(result).toEqual(3)
        expect(loader).toHaveBeenCalledTimes(2)
      })
    })

    it('Reload should create a lock', async () => {
      const loader = vi.fn(
        (a: number, b: number) =>
          new Promise((resolve) =>
            setTimeout(() => {
              resolve(a + b)
            }, 1000),
          ),
      )

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        const reloadPromise = cache.reload(1, 2)
        await vi.advanceTimersByTimeAsync(100)
        const resultPromise = cache.get(1, 2)
        await vi.advanceTimersByTimeAsync(1000)
        const reloaded = await reloadPromise
        const loaded = await resultPromise
        expect(reloaded).toStrictEqual(loaded)
        expect(reloaded).toEqual(3)
        expect(loader).toHaveBeenCalledTimes(1)
      })
    })

    it('Reload should be able to set an error state', async () => {
      const loader = vi.fn(
        (_a: number, _b: number) =>
          new Promise((_resolve, reject) =>
            setTimeout(() => {
              reject(new Error('Failed'))
            }, 1000),
          ),
      )

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        const reloadPromise = cache.reload(1, 2)
        const expectation = expect(reloadPromise).rejects.toThrow('Failed')
        await vi.advanceTimersByTimeAsync(1000)
        await expectation

        const actualValue = cache.getObservable(1, 2).getValue()
        expect(actualValue.status).toEqual('failed')
      })
    })
  })

  describe('Obsolete state', () => {
    it('Should reload the value for obsolete states', async () => {
      const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        const result = await cache.get(1, 2)
        expect(result).toEqual(3)

        cache.setObsolete(1, 2)

        const result2 = await cache.get(1, 2)
        expect(result2).toEqual(3)

        expect(loader).toHaveBeenCalledTimes(2)
      })
    })

    it('Should skip setting for already obsolete values', async () => {
      const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        const result = await cache.get(1, 2)
        expect(result).toEqual(3)

        const subscription = vi.fn()
        cache.getObservable(1, 2).subscribe(subscription)

        cache.setObsolete(1, 2)
        cache.setObsolete(1, 2)

        expect(subscription).toHaveBeenCalledTimes(1)
      })
    })

    it('Should throw an error when trying to set obsolete for a non-loaded value', () => {
      using(new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) }), (cache) => {
        expect(() => cache.setObsolete(1, 2)).toThrow()
      })
    })
  })

  describe('Error state', () => {
    it('Should reject and set error state when loading fails', async () => {
      const loader = vi.fn((_a: number, _b: number) => Promise.reject(new Error('Failed')))

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        await expect(cache.get(1, 2)).rejects.toThrow('Failed')
      })
    })

    it('Should reload the value for failed states', async () => {
      let hasFailed = false
      const loader = vi.fn((a: number, b: number) => {
        if (!hasFailed) {
          hasFailed = true
          return Promise.reject(new Error('Failed'))
        }
        return Promise.resolve(a + b)
      })

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        try {
          await cache.get(1, 2)
        } catch (error) {
          // Should fail
        }

        const result2 = await cache.get(1, 2)
        expect(result2).toEqual(3)

        expect(loader).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('getKey option', () => {
    it('Should use the supplied resolver for cache lookup instead of JSON.stringify(args)', async () => {
      const loader = vi.fn((id: string, _payload: { ignored: string }) => Promise.resolve(`loaded-${id}`))
      await usingAsync(
        new Cache({
          load: loader,
          getKey: (id) => id,
        }),
        async (cache) => {
          const first = await cache.get('a', { ignored: 'one' })
          const second = await cache.get('a', { ignored: 'two' })
          expect(first).toEqual('loaded-a')
          expect(second).toEqual('loaded-a')
          expect(loader).toHaveBeenCalledTimes(1)
        },
      )
    })

    it('Should arm cacheTime timers when setExplicitValue is called with a loaded value', async () => {
      await usingAsync(
        new Cache<string, [string]>({
          load: () => Promise.reject(new Error('should not be called')),
          cacheTimeMs: 100,
          getKey: (id) => id,
        }),
        async (cache) => {
          cache.setExplicitValue({
            loadArgs: ['session-1'],
            value: { status: 'loaded', value: 'user-payload', updatedAt: new Date() },
          })
          expect(cache.has('session-1')).toBe(true)
          await vi.advanceTimersByTimeAsync(150)
          expect(cache.has('session-1')).toBe(false)
        },
      )
    })

    it('Should not arm timers when setExplicitValue is called with a non-loaded value', async () => {
      await usingAsync(
        new Cache<string, [string]>({
          load: () => Promise.reject(new Error('should not be called')),
          cacheTimeMs: 100,
          getKey: (id) => id,
        }),
        async (cache) => {
          cache.setExplicitValue({
            loadArgs: ['session-1'],
            value: { status: 'failed', error: new Error('boom'), updatedAt: new Date() },
          })
          await vi.advanceTimersByTimeAsync(150)
          expect(cache.has('session-1')).toBe(true)
        },
      )
    })
  })

  describe('Tag-based invalidation', () => {
    type TenantUser = { username: string; tenant: string }
    type UserCacheTag = `tenant:${string}` | `user:${string}`

    const makeUserCache = (
      load: (sessionId: string) => Promise<TenantUser>,
      capacity?: number,
    ): Cache<TenantUser, [string], UserCacheTag> =>
      new Cache<TenantUser, [string], UserCacheTag>({
        load,
        getKey: (sessionId) => `cookie:${sessionId}`,
        getTags: (user) => [`tenant:${user.tenant}`, `user:${user.username}`],
        capacity,
      })

    it('obsoleteByTag transitions every loaded entry tagged with the supplied tag', async () => {
      const load = vi.fn(async (sessionId: string) => ({
        username: sessionId === 's-2' ? 'bob' : 'alice',
        tenant: 'acme',
      }))
      await usingAsync(makeUserCache(load), async (cache) => {
        await cache.get('s-1')
        await cache.get('s-2')

        const affected = cache.obsoleteByTag('tenant:acme')

        expect(affected).toEqual(2)
        expect(cache.getObservable('s-1').getValue().status).toEqual('obsolete')
        expect(cache.getObservable('s-2').getValue().status).toEqual('obsolete')
      })
    })

    it('obsoleteByTag returns 0 and is a no-op when the tag is unknown', async () => {
      const load = vi.fn(async () => ({ username: 'alice', tenant: 'acme' }))
      await usingAsync(makeUserCache(load), async (cache) => {
        await cache.get('s-1')

        const affected = cache.obsoleteByTag('user:nobody')

        expect(affected).toEqual(0)
        expect(cache.getObservable('s-1').getValue().status).toEqual('loaded')
      })
    })

    it('obsoleteByTag skips entries in loading / failed / obsolete states', async () => {
      const load = vi.fn(async () => ({ username: 'alice', tenant: 'acme' }))
      await usingAsync(makeUserCache(load), async (cache) => {
        await cache.get('s-loaded')

        cache.setExplicitValue({
          loadArgs: ['s-failed'],
          value: {
            status: 'failed',
            error: new Error('boom'),
            value: { username: 'alice', tenant: 'acme' },
            updatedAt: new Date(),
          },
        })

        await cache.get('s-obsolete')
        cache.setObsolete('s-obsolete')

        expect(cache.obsoleteByTag('user:alice')).toEqual(1)
        expect(cache.getObservable('s-loaded').getValue().status).toEqual('obsolete')
        expect(cache.getObservable('s-failed').getValue().status).toEqual('failed')
      })
    })

    it('Tags persist across a loaded → failed transition so removeByTag still matches', async () => {
      let shouldFail = false
      const load = vi.fn(async () => {
        if (shouldFail) {
          throw new Error('boom')
        }
        return { username: 'alice', tenant: 'acme' }
      })
      await usingAsync(makeUserCache(load), async (cache) => {
        await cache.get('s-1')
        shouldFail = true
        await expect(cache.reload('s-1')).rejects.toThrow('boom')
        expect(cache.getObservable('s-1').getValue().status).toEqual('failed')

        expect(cache.obsoleteByTag('user:alice')).toEqual(0)
        expect(cache.removeByTag('user:alice')).toEqual(1)
        expect(cache.has('s-1')).toBe(false)
      })
    })

    it('Tags persist across a loaded → obsolete transition so removeByTag still matches', async () => {
      const load = vi.fn(async () => ({ username: 'alice', tenant: 'acme' }))
      await usingAsync(makeUserCache(load), async (cache) => {
        await cache.get('s-1')
        cache.setObsolete('s-1')
        expect(cache.getObservable('s-1').getValue().status).toEqual('obsolete')

        expect(cache.obsoleteByTag('user:alice')).toEqual(0)
        expect(cache.removeByTag('user:alice')).toEqual(1)
        expect(cache.has('s-1')).toBe(false)
      })
    })

    it('removeByTag removes every tagged entry regardless of state and clears pending stale timers', async () => {
      const load = vi.fn(async (sessionId: string) => ({
        username: sessionId === 's-2' ? 'bob' : 'alice',
        tenant: 'acme',
      }))
      await usingAsync(
        new Cache<TenantUser, [string], UserCacheTag>({
          load,
          getKey: (sessionId) => `cookie:${sessionId}`,
          getTags: (user) => [`tenant:${user.tenant}`, `user:${user.username}`],
          staleTimeMs: 1000,
        }),
        async (cache) => {
          await cache.get('s-1')
          await cache.get('s-2')

          const removed = cache.removeByTag('tenant:acme')

          expect(removed).toEqual(2)
          expect(cache.has('s-1')).toBe(false)
          expect(cache.has('s-2')).toBe(false)

          await vi.advanceTimersByTimeAsync(2000)
          expect(cache.has('s-1')).toBe(false)
          expect(cache.has('s-2')).toBe(false)
          expect(cache.getCount()).toEqual(0)
        },
      )
    })

    it('removeByTag returns 0 when the tag is unknown', async () => {
      const load = vi.fn(async () => ({ username: 'alice', tenant: 'acme' }))
      await usingAsync(makeUserCache(load), async (cache) => {
        await cache.get('s-1')

        expect(cache.removeByTag('tenant:other')).toEqual(0)
        expect(cache.has('s-1')).toBe(true)
      })
    })

    it('Tag index reflects diffs when an entry is reloaded with a different tag set', async () => {
      let username = 'alice'
      const load = vi.fn(async () => ({ username, tenant: 'acme' }))
      await usingAsync(makeUserCache(load), async (cache) => {
        await cache.get('s-1')
        expect(cache.obsoleteByTag('user:alice')).toEqual(1)

        await cache.get('s-1')
        username = 'alice-renamed'
        await cache.reload('s-1')

        expect(cache.obsoleteByTag('user:alice')).toEqual(0)
        expect(cache.obsoleteByTag('user:alice-renamed')).toEqual(1)
      })
    })

    it('LRU eviction drops evicted keys from the tag index', async () => {
      const load = vi.fn(async (sessionId: string) => ({ username: sessionId, tenant: 'acme' }))
      await usingAsync(makeUserCache(load, 2), async (cache) => {
        await cache.get('s-1')
        await cache.get('s-2')
        await cache.get('s-3')

        expect(cache.removeByTag('user:s-1')).toEqual(0)
        expect(cache.obsoleteByTag('tenant:acme')).toEqual(2)
      })
    })

    it('flushAll clears the tag index', async () => {
      const load = vi.fn(async () => ({ username: 'alice', tenant: 'acme' }))
      await usingAsync(makeUserCache(load), async (cache) => {
        await cache.get('s-1')
        cache.flushAll()

        expect(cache.removeByTag('tenant:acme')).toEqual(0)
        expect(cache.obsoleteByTag('user:alice')).toEqual(0)
      })
    })

    it('Duplicate tags returned by getTags are deduplicated', async () => {
      const load = vi.fn(async (sessionId: string) => ({ username: sessionId, tenant: 'acme' }))
      await usingAsync(
        new Cache<TenantUser, [string], 'dup'>({
          load,
          getKey: (sessionId) => sessionId,
          getTags: () => ['dup', 'dup', 'dup'],
        }),
        async (cache) => {
          await cache.get('s-1')
          expect(cache.removeByTag('dup')).toEqual(1)
        },
      )
    })

    it('Empty tags array leaves an entry unmatched by any tag', async () => {
      const load = vi.fn(async (sessionId: string) => ({ username: sessionId, tenant: 'acme' }))
      await usingAsync(
        new Cache<TenantUser, [string], string>({
          load,
          getKey: (sessionId) => sessionId,
          getTags: () => [],
        }),
        async (cache) => {
          await cache.get('s-1')
          expect(cache.obsoleteByTag('anything')).toEqual(0)
          expect(cache.removeByTag('anything')).toEqual(0)
          expect(cache.has('s-1')).toBe(true)
        },
      )
    })

    it('No-ops when getTags is not configured', async () => {
      const load = vi.fn((a: number, b: number) => Promise.resolve(a + b))
      await usingAsync(new Cache({ load }), async (cache) => {
        await cache.get(1, 2)
        expect(cache.obsoleteByTag('whatever')).toEqual(0)
        expect(cache.removeByTag('whatever')).toEqual(0)
        expect(cache.has(1, 2)).toBe(true)
      })
    })

    it('setExplicitValue with a loaded value computes tags', async () => {
      const load = vi.fn(async () => ({ username: 'alice', tenant: 'acme' }))
      await usingAsync(makeUserCache(load), async (cache) => {
        cache.setExplicitValue({
          loadArgs: ['s-1'],
          value: {
            status: 'loaded',
            value: { username: 'alice', tenant: 'acme' },
            updatedAt: new Date(),
          },
        })

        expect(cache.removeByTag('user:alice')).toEqual(1)
      })
    })

    it('setExplicitValue with a non-loaded value does not register tags', async () => {
      const load = vi.fn(async () => ({ username: 'alice', tenant: 'acme' }))
      await usingAsync(makeUserCache(load), async (cache) => {
        cache.setExplicitValue({
          loadArgs: ['s-1'],
          value: { status: 'failed', error: new Error('boom'), updatedAt: new Date() },
        })

        expect(cache.removeByTag('user:alice')).toEqual(0)
        expect(cache.removeByTag('tenant:acme')).toEqual(0)
        expect(cache.has('s-1')).toBe(true)
      })
    })
  })

  describe('onLoadError event', () => {
    it('should emit onLoadError when getObservable auto-triggers a failing load', async () => {
      const loadError = new Error('load failed')
      const errorHandler = vi.fn()
      await usingAsync(new Cache({ load: () => Promise.reject(loadError) }), async (cache) => {
        cache.addListener('onLoadError', errorHandler)
        cache.getObservable()
        await vi.advanceTimersByTimeAsync(50)
        expect(errorHandler).toHaveBeenCalledTimes(1)
        expect(errorHandler).toHaveBeenCalledWith({ args: [], error: loadError })
      })
    })
  })
})
