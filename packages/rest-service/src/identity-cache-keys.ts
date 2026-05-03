/**
 * Single source of truth for the cache key and cache tag shapes used by the
 * identity-resolution path. Producer (`cookie-auth-provider.getCacheKey`),
 * local invalidation (`HttpUserContext.cookieLogout`,
 * `UserResolutionCache.invalidateByUser`), and any future
 * `IdentityEventBus` subscribers all derive their strings here so the
 * local-vs-replicated invalidation paths cannot drift.
 */

/**
 * Cache key shape for the cookie-authentication provider. Keying by
 * session id is safe because session invalidation drops the session
 * row and the {@link UserResolutionCache} TTL bounds staleness.
 */
export type SessionCacheKey = `cookie:${string}`

/**
 * Tag attached to every {@link UserResolutionCache} entry, derived from
 * the resolved user's `username`. Enables `removeByTag` invalidation
 * across every cached session that resolved to a given user — used by
 * `invalidateByUser` and (later) by `IdentityEventBus` subscribers
 * acting on `userRolesChanged` / `userDeleted` / `passwordChanged`
 * events.
 */
export type UserCacheTag = `user:${string}`

/** Builds the cookie-auth cache key for `sessionId`. */
export const sessionCacheKey = (sessionId: string): SessionCacheKey => `cookie:${sessionId}`

/** Builds the user-resolution cache tag for `username`. */
export const userCacheTag = (username: string): UserCacheTag => `user:${username}`
