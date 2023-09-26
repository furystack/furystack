import { sleepAsync } from '@furystack/utils'
import { Cache } from './cache.js'
import { describe, it, expect, vi } from 'vitest'
describe('Cache', () => {
  it('should be constructed and disposed', () => {
    const cache = new Cache({ load: () => Promise.resolve(1) })
    cache.dispose()
  })

  it('Should return values as observables', async () => {
    const cache = new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) })

    const obs = cache.getObservable(1, 2)
    expect(obs.getValue().status).toEqual('uninitialized')

    await sleepAsync(10)

    expect(obs.getValue().status).toEqual('loaded')
    expect(obs.getValue().value).toEqual(3)

    cache.dispose()
  })

  it('Should trigger loader only if the value is not in the cache when getting an observable', async () => {
    const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))
    const cache = new Cache({ load: loader })

    const obs = cache.getObservable(1, 2)
    expect(obs.getValue().status).toEqual('uninitialized')

    const result = await cache.get(1, 2)
    expect(result).toEqual(3)

    expect(obs.getValue().status).toEqual('loaded')

    const obs2 = cache.getObservable(1, 2)
    expect(obs2.getValue().status).toEqual('loaded')

    expect(loader).toHaveBeenCalledTimes(1)

    cache.dispose()
  })

  it('Should remove the oldest entry when capacity limit is reached', async () => {
    const cache = new Cache({ load: (a: number, b: number) => Promise.resolve(a + b), capacity: 2 })
    await cache.get(1, 2)
    await cache.get(1, 3)
    await cache.get(1, 4)
    expect(cache.getCount()).toEqual(2)
    cache.dispose()
  })

  it('Should remove value from the cache', async () => {
    const cache = new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) })
    await cache.get(1, 2)
    await cache.get(1, 3)
    expect(cache.getCount()).toEqual(2)
    cache.remove(1, 2)
    expect(cache.getCount()).toEqual(1)
    cache.dispose()
  })

  it('Should remove a value from the cache, based on a predicate', async () => {
    const cache = new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) })
    await cache.get(1, 2)
    await cache.get(1, 3)
    expect(cache.getCount()).toEqual(2)
    cache.removeRange((v) => v === 3)
    expect(cache.getCount()).toEqual(1)
    cache.dispose()
  })

  it('Should remove all values from the cache', async () => {
    const cache = new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) })
    await cache.get(1, 2)
    await cache.get(1, 3)
    expect(cache.getCount()).toEqual(2)
    cache.flushAll()
    expect(cache.getCount()).toEqual(0)
    cache.dispose()
  })

  it('Should set an explicit value', async () => {
    const load = vi.fn((a: number, b: number) => Promise.resolve(a + b))
    const cache = new Cache({ load })
    cache.setExplicitValue({ loadArgs: [1, 2], value: { status: 'loaded', value: 3, updatedAt: new Date() } })
    expect(cache.getCount()).toEqual(1)

    const result = await cache.get(1, 2)
    expect(result).toEqual(3)
    expect(load).not.toHaveBeenCalled()

    cache.dispose()
  })

  describe('Loading, locking and reloading', () => {
    it('should store and retrieve results based on the arguments', async () => {
      const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))

      const cache = new Cache({ load: loader })
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

      cache.dispose()
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

      const cache = new Cache({ load: loader })
      const resultPromise = cache.get(1, 2)
      await sleepAsync(100)
      const result2 = await cache.get(1, 2)
      const result = await resultPromise
      expect(result).toStrictEqual(result2)
      expect(result).toEqual(3)
      expect(loader).toHaveBeenCalledTimes(1)
      cache.dispose()
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

      const cache = new Cache({ load: loader })
      const result = await cache.get(1, 2)
      const result2 = await cache.reload(1, 2)
      expect(result).toStrictEqual(result2)
      expect(result).toEqual(3)
      expect(loader).toHaveBeenCalledTimes(2)
      cache.dispose()
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

      const cache = new Cache({ load: loader })
      const reloadPromise = cache.reload(1, 2)
      await sleepAsync(100)
      const resultPromise = await cache.get(1, 2)
      const reloaded = await reloadPromise
      const loaded = await resultPromise
      expect(reloaded).toStrictEqual(loaded)
      expect(reloaded).toEqual(3)
      expect(loader).toHaveBeenCalledTimes(1)
      cache.dispose()
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

      const cache = new Cache({ load: loader })
      await expect(cache.reload(1, 2)).rejects.toThrow('Failed')

      const actualValue = await cache.getObservable(1, 2).getValue()
      expect(actualValue.status).toEqual('failed')

      cache.dispose()
    })
  })

  describe('Obsolete state', () => {
    it('Should reload the value for obsolete states', async () => {
      const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))

      const cache = new Cache({ load: loader })
      const result = await cache.get(1, 2)
      expect(result).toEqual(3)

      cache.setObsolete(1, 2)

      const result2 = await cache.get(1, 2)
      expect(result2).toEqual(3)

      expect(loader).toHaveBeenCalledTimes(2)

      cache.dispose()
    })

    it('Should skip setting for already obsolete values', async () => {
      const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))

      const cache = new Cache({ load: loader })
      const result = await cache.get(1, 2)
      expect(result).toEqual(3)

      const subscription = vi.fn()
      cache.getObservable(1, 2).subscribe(subscription)

      cache.setObsolete(1, 2)
      cache.setObsolete(1, 2)

      expect(subscription).toHaveBeenCalledTimes(1)

      cache.dispose()
    })

    it('Should throw an error when trying to set obsolete for a non-loaded value', async () => {
      const cache = new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) })
      expect(() => cache.setObsolete(1, 2)).toThrow()
      cache.dispose()
    })

    it('Should set an obsolete state based on a predicate', async () => {
      const loader = vi.fn((a: number, b: number) => Promise.resolve(a + b))

      const cache = new Cache({ load: loader })
      const result = await cache.get(1, 2)
      expect(result).toEqual(3)

      cache.obsoleteRange((v) => v === 3)

      const result2 = await cache.get(1, 2)
      expect(result2).toEqual(3)

      expect(loader).toHaveBeenCalledTimes(2)

      cache.dispose()
    })
  })

  describe('Error state', () => {
    it('Should reject and set error state when loading fails', () => {
      const loader = vi.fn((_a: number, _b: number) => Promise.reject(new Error('Failed')))

      const cache = new Cache({ load: loader })

      return expect(cache.get(1, 2)).rejects.toThrow('Failed')
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

      const cache = new Cache({ load: loader })
      try {
        await cache.get(1, 2)
      } catch (error) {
        // Should fail
      }

      const result2 = await cache.get(1, 2)
      expect(result2).toEqual(3)

      expect(loader).toHaveBeenCalledTimes(2)

      cache.dispose()
    })
  })
})
