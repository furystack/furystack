import type { User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { defineService, type Token } from '@furystack/inject'
import type { DataSetToken } from '@furystack/repository'
import type { AuthenticationProvider } from './authentication-providers/authentication-provider.js'
import type { useHttpAuthentication } from './helpers.js'
import type { HttpUserContext } from './http-user-context.js'
import type { DefaultSession } from './models/default-session.js'
import { SessionDataSet, UserDataSet } from './user-store.js'

/**
 * HTTP-authentication settings — rebound by {@link useHttpAuthentication}
 * during application setup and consumed by {@link HttpUserContext},
 * cookie-login strategies and OpenAPI generators.
 *
 * `userDataSet` / `sessionDataSet` are token references — consumers resolve
 * them through the injector at the appropriate scope. `authenticationProviders`
 * is an ordered list walked by {@link HttpUserContext} on every
 * unauthenticated request.
 */
export interface HttpAuthenticationSettings {
  /** Data set token for user lookups. */
  userDataSet: DataSetToken<User, 'username'>
  /** Data set token for session lookups. */
  sessionDataSet: DataSetToken<DefaultSession, 'sessionId'>
  /** Cookie name used by the built-in cookie-auth provider. */
  cookieName: string
  /** Whether the built-in Basic Auth provider is installed by {@link useHttpAuthentication}. */
  enableBasicAuth: boolean
  /**
   * Ordered list of authentication providers. Populated during
   * {@link useHttpAuthentication} and extended by plugins such as
   * `useJwtAuthentication`.
   */
  authenticationProviders: AuthenticationProvider[]
  /**
   * TTL applied to the user-resolution cache. Every authenticated request
   * runs at most one provider chain walk per cache key per TTL window;
   * subsequent calls within the window return the cached `User`.
   *
   * Bounds the staleness window for out-of-band identity changes
   * (session invalidation on a sibling instance, role mutation in storage,
   * etc.) when the application is deployed across multiple nodes.
   *
   * Set to `0` to disable caching entirely. When omitted, the default
   * {@link DEFAULT_USER_CACHE_TTL_MS} is used by `UserResolutionCache`.
   */
  userCacheTtlMs?: number
  /**
   * Maximum number of entries in the user-resolution cache before LRU
   * eviction kicks in. When omitted, the default
   * {@link DEFAULT_USER_CACHE_CAPACITY} is used by `UserResolutionCache`.
   */
  userCacheCapacity?: number
}

/** Default TTL applied to the user-resolution cache (30 seconds). */
export const DEFAULT_USER_CACHE_TTL_MS = 30_000

/** Default LRU capacity ceiling for the user-resolution cache. */
export const DEFAULT_USER_CACHE_CAPACITY = 10_000

/**
 * Returns a fresh copy of the default {@link HttpAuthenticationSettings}.
 * Used as the starting point inside {@link useHttpAuthentication}.
 */
export const defaultHttpAuthenticationSettings = (): HttpAuthenticationSettings => ({
  userDataSet: UserDataSet,
  sessionDataSet: SessionDataSet,
  cookieName: 'fss',
  enableBasicAuth: true,
  authenticationProviders: [],
  userCacheTtlMs: DEFAULT_USER_CACHE_TTL_MS,
  userCacheCapacity: DEFAULT_USER_CACHE_CAPACITY,
})

/**
 * DI token carrying the current {@link HttpAuthenticationSettings}. Rebind
 * via {@link useHttpAuthentication} (preferred) or directly through
 * {@link Injector.bind} for advanced scenarios.
 */
export const HttpAuthenticationSettings: Token<HttpAuthenticationSettings, 'singleton'> = defineService({
  name: 'furystack/rest-service/HttpAuthenticationSettings',
  lifetime: 'singleton',
  factory: () => defaultHttpAuthenticationSettings(),
})
