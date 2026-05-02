<!-- version-type: major -->

# @furystack/cache

## 💥 Breaking Changes

### Removed `Cache.obsoleteRange` and `Cache.removeRange`

The predicate-based range APIs `Cache.obsoleteRange((value, args) => boolean)` and `Cache.removeRange((value, args) => boolean)` have been removed. Their predicate signature was inherently non-serializable, which made it impossible to replicate the same invalidation across processes (e.g. over a cross-node event bus).

**Migration:** switch to the new tag-based invalidation API. Configure `getTags` on the cache and call `obsoleteByTag(tag)` / `removeByTag(tag)` with a plain string. See the new feature entry below.

```ts
// Before
cache.removeRange((value) => value.username === username)

// After
const cache = new Cache<User, [string], `user:${string}`>({
  load: (sessionId) => resolveSession(sessionId),
  getKey: (sessionId) => `cookie:${sessionId}`,
  getTags: (user) => [`user:${user.username}`],
})
cache.removeByTag(`user:${username}`)
```

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

### Tag-based invalidation (`getTags`, `obsoleteByTag`, `removeByTag`)

`Cache` now supports tag-based invalidation. The new `getTags?: (value, ...args) => readonly TTag[]` setting attaches a set of plain string tags to each entry whenever it transitions to a `'loaded'` state. The new `obsoleteByTag(tag)` and `removeByTag(tag)` methods then act on every entry currently bound to that tag, returning the affected entry count.

Tags are deliberately serializable so the same invalidation can be replicated by other processes — designed for replay over a cross-node event bus. `getTags` receives both the loaded value and the originating args, so tags can incorporate state that lives only on the value side (e.g. extracting a `username` from a session-keyed identity cache). The third generic parameter `TTag extends string = string` lets callers narrow tags to a string-literal union for compile-time safety.

**Example:**

```typescript
type UserCacheTag = `tenant:${string}` | `user:${string}`

const cache = new Cache<User, [string], UserCacheTag>({
  load: (sessionId) => resolveSession(sessionId),
  getKey: (sessionId) => `cookie:${sessionId}`,
  getTags: (user) => [`tenant:${user.tenant}`, `user:${user.username}`],
})

await cache.get('session-abc')

cache.obsoleteByTag('user:alice') // marks loaded entries stale
cache.removeByTag('tenant:acme') // drops every entry for a tenant
cache.obsoleteByTag('typo:foo') // ❌ TypeScript error
```

Tags are deduplicated, persist across `loading` / `failed` / `obsolete` transitions until the next successful load recomputes them, and are cleared automatically on LRU eviction, `remove`, and `flushAll`.

## 🐛 Bug Fixes

### `setExplicitValue` now arms TTL timers for loaded values

`setExplicitValue` previously stored the value but never set up the configured `staleTimeMs` / `cacheTimeMs` timers, so explicitly-primed entries lived forever regardless of the cache configuration. It now calls the same `setupTimers` path that a normal `load()` does whenever the supplied value's status is `'loaded'`. Non-loaded values (`loading`, `failed`, `obsolete`) still leave timers untouched, matching prior behavior.
