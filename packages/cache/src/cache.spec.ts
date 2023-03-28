import { sleepAsync } from '@furystack/utils'
import { Cache } from './cache'
describe('Cache', () => {
  it('should be constructed and disposed', () => {
    const cache = new Cache({ load: () => Promise.resolve(1) })
    cache.dispose()
  })

  it('Should return values as observables', async () => {
    const cache = new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) })

    const obs = cache.getObservable(1, 2)
    expect(obs.getValue().status).toEqual('uninitialized')

    const result = await cache.get(1, 2)
    expect(result).toEqual(3)

    expect(obs.getValue().status).toEqual('loaded')

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

  describe('Loading and locking', () => {
    it('should store and retrieve results based on the arguments', async () => {
      const loader = jest.fn((a: number, b: number) => Promise.resolve(a + b))

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
      const loader = jest.fn(
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
      cache.dispose()
    })
  })

  describe('Obsolete state', () => {
    it('Should reload the value for obsolete states', async () => {
      const loader = jest.fn((a: number, b: number) => Promise.resolve(a + b))

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
      const loader = jest.fn((a: number, b: number) => Promise.resolve(a + b))

      const cache = new Cache({ load: loader })
      const result = await cache.get(1, 2)
      expect(result).toEqual(3)

      const subscription = jest.fn()
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
  })

  describe('Error state', () => {
    it('Should reject and set error state when loading fails', () => {
      const loader = jest.fn((_a: number, _b: number) => Promise.reject(new Error('Failed')))

      const cache = new Cache({ load: loader })

      return expect(cache.get(1, 2)).rejects.toThrow('Failed')
    })

    it('Should reload the value for failed states', async () => {
      let hasFailed = false
      const loader = jest.fn((a: number, b: number) => {
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
