<!-- version-type: minor -->

# @furystack/rest-service

## ✨ Features

### Short-TTL user-resolution cache for `HttpUserContext`

`HttpUserContext.getCurrentUser` now consults a singleton `UserResolutionCache` before walking the configured authentication providers. Successful resolutions are cached per-process under a key produced by the matching provider (e.g. session id for cookie auth) and expire after `HttpAuthenticationSettings.userCacheTtlMs` (default **30 000 ms**, capacity **10 000** entries).

This bounds cross-instance staleness for out-of-band identity changes — session invalidation on a sibling node, role mutation in storage, etc. — while sharply cutting the auth-store load on chatty clients (every authenticated request used to walk the provider chain on every call).

**New configuration on `HttpAuthenticationSettings`:**

| Field               | Default | Effect                                                        |
| ------------------- | ------- | ------------------------------------------------------------- |
| `userCacheTtlMs`    | `30000` | TTL for cached `User` entries. `0` disables caching entirely. |
| `userCacheCapacity` | `10000` | LRU capacity ceiling.                                         |

### Cache-key contract on `AuthenticationProvider`

Added an optional `getCacheKey?(request): string | null` method to `AuthenticationProvider`. Providers that opt in produce stable per-identity keys consumed by the user-resolution cache; providers that omit it (or return `null`) cause the request to bypass the cache.

Built-in providers:

- **`createCookieAuthProvider`** — keys requests by `cookie:${sessionId}`. Cache hits skip both the session-store and user-store lookups.
- **`createBasicAuthProvider`** — intentionally does **not** opt in. Caching by username would skip password verification on every cache hit.
- **`createJwtAuthProvider`** (in `@furystack/auth-jwt`) — also intentionally does **not** opt in. See the `@furystack/auth-jwt` changelog for the rationale (token expiry / revocation must be re-checked per request).

### `UserResolutionCache` token

Exported a new singleton DI token. Consumers can call `injector.get(UserResolutionCache).invalidate(cacheKey)` to drop a specific entry (e.g. after an out-of-band role mutation), or `invalidateAll()` to flush every entry.

`HttpUserContext.cookieLogout` automatically invalidates the local cache entry for the logged-out session, so the very next request on the same node re-authenticates immediately. Sibling nodes still rely on TTL expiry.

**Example — invalidate after an admin mutates roles in storage:**

```typescript
import { UserResolutionCache, UserDataSet } from '@furystack/rest-service'

await injector.get(UserDataSet).update(injector, 'alice', { roles: ['admin'] })
injector.get(UserResolutionCache).invalidate(`cookie:${sessionId}`)
```

## ♻️ Refactoring

### `HttpUserContext` no longer maintains a per-request `WeakMap`

The previous `WeakMap<headers, Promise<User>>` cache (per-`HttpUserContext`-instance) has been removed in favor of the shared `UserResolutionCache`. With the request-scoped HUC, the WeakMap was effectively single-shot per request anyway. Anonymous-style requests (no provider yields a key) now bypass the cache entirely instead of being dedup-cached for the lifetime of the HUC instance.

## ⬆️ Dependencies

- Added `@furystack/cache` as a runtime dependency (`workspace:^`). Used internally by `UserResolutionCache`; not part of `@furystack/rest-service`'s public API surface.
