import type { User } from '@furystack/core'
import { createInjector } from '@furystack/inject'
import { usingAsync } from '@furystack/utils'
import type { IncomingMessage } from 'http'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpAuthenticationSettings, defaultHttpAuthenticationSettings } from './http-authentication-settings.js'
import { resolveUserCacheKey, UserResolutionCache } from './user-resolution-cache.js'

const testUser: User = { username: 'alice', roles: ['reader'] }
const otherUser: User = { username: 'bob', roles: [] }

describe('UserResolutionCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('resolve', () => {
    it('returns the loader result on first call and reuses it on subsequent calls within TTL', async () => {
      await usingAsync(createInjector(), async (i) => {
        i.bind(HttpAuthenticationSettings, () => ({
          ...defaultHttpAuthenticationSettings(),
          userCacheTtlMs: 30_000,
        }))
        const cache = i.get(UserResolutionCache)
        const loader = vi.fn(async () => testUser)
        const first = await cache.resolve('cookie:abc', loader)
        const second = await cache.resolve('cookie:abc', loader)
        expect(first).toBe(testUser)
        expect(second).toBe(testUser)
        expect(loader).toHaveBeenCalledTimes(1)
      })
    })

    it('treats distinct cache keys independently', async () => {
      await usingAsync(createInjector(), async (i) => {
        i.bind(HttpAuthenticationSettings, () => ({
          ...defaultHttpAuthenticationSettings(),
          userCacheTtlMs: 30_000,
        }))
        const cache = i.get(UserResolutionCache)
        const loaderA = vi.fn(async () => testUser)
        const loaderB = vi.fn(async () => otherUser)
        expect(await cache.resolve('cookie:a', loaderA)).toBe(testUser)
        expect(await cache.resolve('cookie:b', loaderB)).toBe(otherUser)
        expect(await cache.resolve('cookie:a', loaderA)).toBe(testUser)
        expect(loaderA).toHaveBeenCalledTimes(1)
        expect(loaderB).toHaveBeenCalledTimes(1)
      })
    })

    it('drops the entry once cacheTimeMs has elapsed', async () => {
      await usingAsync(createInjector(), async (i) => {
        i.bind(HttpAuthenticationSettings, () => ({
          ...defaultHttpAuthenticationSettings(),
          userCacheTtlMs: 100,
        }))
        const cache = i.get(UserResolutionCache)
        const loader = vi.fn(async () => testUser)
        await cache.resolve('cookie:ttl', loader)
        await vi.advanceTimersByTimeAsync(150)
        await cache.resolve('cookie:ttl', loader)
        expect(loader).toHaveBeenCalledTimes(2)
      })
    })

    it('runs the loader on every call when ttl is 0', async () => {
      await usingAsync(createInjector(), async (i) => {
        i.bind(HttpAuthenticationSettings, () => ({
          ...defaultHttpAuthenticationSettings(),
          userCacheTtlMs: 0,
        }))
        const cache = i.get(UserResolutionCache)
        const loader = vi.fn(async () => testUser)
        await cache.resolve('cookie:disabled', loader)
        await cache.resolve('cookie:disabled', loader)
        expect(loader).toHaveBeenCalledTimes(2)
        expect(cache.size).toBe(0)
      })
    })

    it('rejects (without caching) when the loader throws', async () => {
      await usingAsync(createInjector(), async (i) => {
        i.bind(HttpAuthenticationSettings, () => ({
          ...defaultHttpAuthenticationSettings(),
          userCacheTtlMs: 30_000,
        }))
        const cache = i.get(UserResolutionCache)
        const loader = vi
          .fn<() => Promise<User>>()
          .mockRejectedValueOnce(new Error('boom'))
          .mockResolvedValueOnce(testUser)
        await expect(cache.resolve('cookie:err', loader)).rejects.toThrow('boom')
        await expect(cache.resolve('cookie:err', loader)).resolves.toBe(testUser)
        expect(loader).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('invalidate', () => {
    it('drops the targeted entry only', async () => {
      await usingAsync(createInjector(), async (i) => {
        i.bind(HttpAuthenticationSettings, () => ({
          ...defaultHttpAuthenticationSettings(),
          userCacheTtlMs: 30_000,
        }))
        const cache = i.get(UserResolutionCache)
        const loaderA = vi.fn(async () => testUser)
        const loaderB = vi.fn(async () => otherUser)
        await cache.resolve('cookie:a', loaderA)
        await cache.resolve('cookie:b', loaderB)
        cache.invalidate('cookie:a')
        await cache.resolve('cookie:a', loaderA)
        await cache.resolve('cookie:b', loaderB)
        expect(loaderA).toHaveBeenCalledTimes(2)
        expect(loaderB).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('invalidateAll', () => {
    it('flushes every entry', async () => {
      await usingAsync(createInjector(), async (i) => {
        i.bind(HttpAuthenticationSettings, () => ({
          ...defaultHttpAuthenticationSettings(),
          userCacheTtlMs: 30_000,
        }))
        const cache = i.get(UserResolutionCache)
        await cache.resolve('cookie:a', async () => testUser)
        await cache.resolve('cookie:b', async () => otherUser)
        expect(cache.size).toBe(2)
        cache.invalidateAll()
        expect(cache.size).toBe(0)
      })
    })
  })
})

describe('resolveUserCacheKey', () => {
  it('returns the first non-null key from the configured providers', () => {
    const settings = {
      ...defaultHttpAuthenticationSettings(),
      authenticationProviders: [
        { name: 'first', authenticate: async () => null, getCacheKey: () => null },
        { name: 'second', authenticate: async () => null, getCacheKey: () => 'cookie:matched' },
        { name: 'third', authenticate: async () => null, getCacheKey: () => 'jwt:not-reached' },
      ],
    }
    expect(resolveUserCacheKey(settings, { headers: {} } as IncomingMessage)).toBe('cookie:matched')
  })

  it('returns null when every provider opts out', () => {
    const settings = {
      ...defaultHttpAuthenticationSettings(),
      authenticationProviders: [
        { name: 'a', authenticate: async () => null },
        { name: 'b', authenticate: async () => null, getCacheKey: () => null },
      ],
    }
    expect(resolveUserCacheKey(settings, { headers: {} } as IncomingMessage)).toBeNull()
  })
})
