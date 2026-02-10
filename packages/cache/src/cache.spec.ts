import { sleepAsync, using, usingAsync } from '@furystack/utils'
import { Cache } from './cache.js'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
describe('Cache', () => {
  it('should be constructed and disposed', () => {
    using(new Cache({ load: () => Promise.resolve(1) }), () => {
      // Constructed and disposed automatically
    })
  })

  it('Should return values as observables', async () => {
    await usingAsync(new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) }), async (cache) => {
      const obs = cache.getObservable(1, 2)
      expect(obs.getValue().status).toEqual('uninitialized')

      await sleepAsync(10)

      expect(obs.getValue().status).toEqual('loaded')
      expect(obs.getValue().value).toEqual(3)
    })
  })

  it('Should trigger loader only if the value is not in the cache when getting an observable', async () => {
    const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))
    await usingAsync(new Cache({ load: loader }), async (cache) => {
      const obs = cache.getObservable(1, 2)
      expect(obs.getValue().status).toEqual('uninitialized')

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
        await sleepAsync(200)
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
        await sleepAsync(200)
      },
    )
  })

  it('Should remove the value from the cache after the cache time has passed', async () => {
    await usingAsync(
      new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), cacheTimeMs: 100 }),
      async (cache) => {
        await cache.get(1, 2)
        cache.remove(1, 2)
        await sleepAsync(200)
        expect(cache.has(1, 2)).toEqual(false)
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

  it('Should remove a value from the cache, based on a predicate', async () => {
    await usingAsync(new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) }), async (cache) => {
      await cache.get(1, 2)
      await cache.get(1, 3)
      expect(cache.getCount()).toEqual(2)
      cache.removeRange((v) => v === 3)
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
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

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

    it('Should set an obsolete state based on a predicate', async () => {
      const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))

      await usingAsync(new Cache({ load: loader }), async (cache) => {
        const result = await cache.get(1, 2)
        expect(result).toEqual(3)

        cache.obsoleteRange((v) => v === 3)

        const result2 = await cache.get(1, 2)
        expect(result2).toEqual(3)

        expect(loader).toHaveBeenCalledTimes(2)
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
})
