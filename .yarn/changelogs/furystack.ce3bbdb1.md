<!-- version-type: patch -->

# furystack

## ✨ Features

### Short-TTL user-resolution cache

Added a singleton `UserResolutionCache` token in `@furystack/rest-service` and a corresponding `getCacheKey` hook on `AuthenticationProvider`. `HttpUserContext.getCurrentUser` now caches successful identity resolutions for `userCacheTtlMs` (default 30 s), bounding cross-instance staleness for out-of-band session/role changes and cutting auth-store load on chatty clients.

`@furystack/cache` gained a `getKey` option so callers can index entries by a derived key when their cache args include large or non-stringifiable values; `setExplicitValue` also now respects the configured TTL timers when priming a `loaded` value.

See the `@furystack/cache` and `@furystack/rest-service` changelogs for the full details and migration notes.

## 🐛 Bug Fixes

- Fixed `Cache.setExplicitValue` not arming `staleTimeMs` / `cacheTimeMs` timers when the supplied value's status was `'loaded'`. Explicitly-primed entries now expire on the same schedule as entries populated via `load()`.
