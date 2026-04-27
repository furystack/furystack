import type { User } from '@furystack/core'
import { Cache } from '@furystack/cache'
import { defineService, type Token } from '@furystack/inject'
import type { IncomingMessage } from 'http'
import type { AuthenticationProvider } from './authentication-providers/authentication-provider.js'
import {
  DEFAULT_USER_CACHE_CAPACITY,
  DEFAULT_USER_CACHE_TTL_MS,
  HttpAuthenticationSettings,
} from './http-authentication-settings.js'
import type { HttpUserContext } from './http-user-context.js'

/**
 * Singleton TTL cache that memoizes successful identity resolutions across
 * requests within a single process.
 *
 * Cache keys are produced by the configured {@link AuthenticationProvider}s
 * via their `getCacheKey` method (e.g. cookie-auth keys by session id). The
 * cache's `load` callback runs the same provider chain that
 * {@link HttpUserContext.authenticateRequest} would run — it is supplied via
 * an internal "loader" registered when the {@link HttpUserContext} is
 * resolved.
 *
 * Entries expire after `HttpAuthenticationSettings.userCacheTtlMs`; capacity
 * is bounded by `HttpAuthenticationSettings.userCacheCapacity`. Setting the
 * TTL to `0` disables caching (the loader runs on every call).
 *
 * **Multi-node note:** session invalidation on one instance does not
 * propagate to siblings — the TTL bounds the staleness window. Apps that
 * need stricter freshness must shorten the TTL or invalidate explicitly via
 * {@link UserResolutionCache.invalidate}.
 */
export interface UserResolutionCache extends Disposable {
  /**
   * Returns the cached or freshly-resolved `User` for the supplied
   * cache key. The `loader` is invoked on cache miss; concurrent calls for
   * the same key dedupe to a single loader invocation.
   */
  resolve(cacheKey: string, loader: () => Promise<User>): Promise<User>
  /** Drops a single cache entry. No-op when the key is unknown. */
  invalidate(cacheKey: string): void
  /** Drops every cached entry. */
  invalidateAll(): void
  /** Returns the current entry count (for diagnostics / tests). */
  readonly size: number
}

class UserResolutionCacheImpl implements UserResolutionCache {
  private readonly loaders = new Map<string, () => Promise<User>>()
  private readonly cache: Cache<User, [string]> | null

  constructor(ttlMs: number, capacity: number) {
    if (ttlMs <= 0) {
      this.cache = null
      return
    }
    this.cache = new Cache<User, [string]>({
      load: (cacheKey) => {
        const loader = this.loaders.get(cacheKey)
        if (!loader) {
          // The loader is only registered for the duration of a `resolve()`
          // call. A reload triggered via `cache.get(key)` outside that call
          // (e.g. from `getObservable`) would have no loader; refuse the
          // load instead of caching `null`.
          return Promise.reject(new Error(`No loader registered for cache key '${cacheKey}'`))
        }
        return loader()
      },
      cacheTimeMs: ttlMs,
      capacity,
      getKey: (cacheKey) => cacheKey,
    })
  }

  public async resolve(cacheKey: string, loader: () => Promise<User>): Promise<User> {
    if (!this.cache) {
      return loader()
    }
    this.loaders.set(cacheKey, loader)
    try {
      return await this.cache.get(cacheKey)
    } finally {
      // Loader is per-request; clearing prevents the cache from re-running it
      // out-of-band when the entry transitions to obsolete and a sibling call
      // queries `getObservable`.
      this.loaders.delete(cacheKey)
    }
  }

  public invalidate(cacheKey: string): void {
    this.cache?.remove(cacheKey)
  }

  public invalidateAll(): void {
    this.cache?.flushAll()
  }

  public get size(): number {
    return this.cache?.getCount() ?? 0
  }

  public [Symbol.dispose](): void {
    this.cache?.[Symbol.dispose]()
    this.loaders.clear()
  }
}

/**
 * DI token for the singleton {@link UserResolutionCache}. Resolved lazily
 * by {@link HttpUserContext}; sized from {@link HttpAuthenticationSettings}.
 */
export const UserResolutionCache: Token<UserResolutionCache, 'singleton'> = defineService({
  name: 'furystack/rest-service/UserResolutionCache',
  lifetime: 'singleton',
  factory: ({ inject, onDispose }): UserResolutionCache => {
    const settings = inject(HttpAuthenticationSettings)
    const ttlMs = settings.userCacheTtlMs ?? DEFAULT_USER_CACHE_TTL_MS
    const capacity = settings.userCacheCapacity ?? DEFAULT_USER_CACHE_CAPACITY
    const impl = new UserResolutionCacheImpl(ttlMs, capacity)
    onDispose(() => {
      // eslint-disable-next-line furystack/prefer-using-wrapper -- onDispose is the teardown hook
      impl[Symbol.dispose]()
    })
    return impl
  },
})

/**
 * Resolves the configured cache key for the supplied request by walking the
 * authentication providers in order and returning the first non-null key.
 *
 * Returns `null` when no provider opts in to caching (e.g. Basic Auth, or
 * an anonymous request). The caller should bypass the cache in that case.
 *
 * Exported so plugins / tests can derive the same key the cache uses.
 */
export const resolveUserCacheKey = (
  settings: HttpAuthenticationSettings,
  request: Pick<IncomingMessage, 'headers'>,
): string | null => {
  for (const provider of settings.authenticationProviders) {
    if (!provider.getCacheKey) continue
    const key = provider.getCacheKey(request)
    if (key) return key
  }
  return null
}
