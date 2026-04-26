<!-- version-type: minor -->

# @furystack/cache

## ✨ Features

### `getKey` option for `Cache`

Added a `getKey?: (...args: TArgs) => string` option to `CacheSettings`. When supplied it overrides the default `JSON.stringify(args)` cache-index resolver, so callers can use cache args that include large or non-stringifiable values (e.g. `IncomingMessage`, DOM nodes) and still index entries by a small derived key.

**Example:**

```typescript
const cache = new Cache<User, [string, IncomingMessage]>({
  load: (_sessionId, request) => walkProviders(request),
  getKey: (sessionId) => sessionId, // request is excluded from the key
  cacheTimeMs: 30_000,
})

const user = await cache.get('session-abc', request)
```

**Note:** the predicates passed to `Cache.obsoleteRange` and `Cache.removeRange` receive the args reference from the most recent `get` / `reload` / `setExplicitValue` call for that entry. Do not mutate args after caching; clone before passing if a snapshot is needed.

## 🐛 Bug Fixes

### `setExplicitValue` now arms TTL timers for loaded values

`setExplicitValue` previously stored the value but never set up the configured `staleTimeMs` / `cacheTimeMs` timers, so explicitly-primed entries lived forever regardless of the cache configuration. It now calls the same `setupTimers` path that a normal `load()` does whenever the supplied value's status is `'loaded'`. Non-loaded values (`loading`, `failed`, `obsolete`) still leave timers untouched, matching prior behavior.

### `obsoleteRange` / `removeRange` now work with custom `getKey`

The range APIs previously rebuilt the predicate's `args` argument by calling `JSON.parse(key)`, which threw or returned garbage whenever a custom `getKey` produced non-JSON keys. The state manager now stores the args alongside each entry (refreshed on every `get` / `reload` / `setExplicitValue`) so range predicates receive the live args reference regardless of how the cache key is computed.
