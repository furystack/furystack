# @furystack/cache

A simple caching utility for FuryStack, providing in-memory cache management to improve performance and reduce redundant computations in your applications.

## Installation

```bash
npm install @furystack/cache
# or
yarn add @furystack/cache
```

## Usage Examples

### Basic In-Memory Cache

```ts
import { Cache } from '@furystack/cache'

const cache = new Cache({ load: (a: number, b: number) => Promise.resolve(a + b) })

const result = await cache.get(1, 2) // 3 will be calculated and cached
const cachedResult = await cache.get(1, 2) // Returns cached value: 3
```

### Stale and Cache Time

```ts
import { Cache } from '@furystack/cache'
const cache = new Cache({
  load: (a: number, b: number) => Promise.resolve(a + b),
  staleTimeMs: 5000, // Mark as obsolete after 5 seconds
  cacheTimeMs: 60000, // Remove from cache after 60 seconds
})
const result = await cache.get(1, 2) // 3 will be calculated and cached
```

### Limit Capacity

```ts
import { Cache } from '@furystack/cache'
const cache = new Cache({
  load: (a: number, b: number) => Promise.resolve(a + b),
  capacity: 2, // Limit cache to 2 items
})
await cache.get(1, 2) // 3 will be calculated and cached
await cache.get(2, 3) // 5 will be calculated and cached
await cache.get(3, 4) // 7 will be calculated and cached, evicts (1, 2) from cache
const result = await cache.get(1, 2) // Recalculates: 3
```

### Invalidate

```ts
import { Cache } from '@furystack/cache'
const cache = new Cache({
  load: (a: number, b: number) => Promise.resolve(a + b),
})
await cache.get(1, 2) // 3 will be calculated and cached
cache.remove(1, 2) // Removes the specific cached item
const result = await cache.get(1, 2) // Recalculates: 3

cache.flushAll() // Removes all cached items
```

### Tag-based invalidation

`getTags` attaches a set of plain string tags to each entry whenever it transitions to a `loaded` state. `obsoleteByTag` and `removeByTag` then act on every entry currently bound to that tag. Tags are deliberately serializable so the same invalidation can be replicated over a cross-process bus.

```ts
import { Cache } from '@furystack/cache'

type User = { username: string; tenant: string }
type UserCacheTag = `tenant:${string}` | `user:${string}`

const cache = new Cache<User, [string], UserCacheTag>({
  load: (sessionId) => resolveSession(sessionId),
  getKey: (sessionId) => `cookie:${sessionId}`,
  getTags: (user) => [`tenant:${user.tenant}`, `user:${user.username}`],
})

await cache.get('session-abc')

cache.obsoleteByTag('user:alice') // mark loaded entries stale
cache.removeByTag('tenant:acme') // drop every entry for a tenant
```

`getTags` receives the loaded value and the originating args, so tags can incorporate state that lives only on the value side. Tags persist across `loading` / `failed` / `obsolete` transitions until the next successful load recomputes them.

### Subscribe to Changes

```ts
import { Cache } from '@furystack/cache'
const cache = new Cache({
  load: (a: number, b: number) => Promise.resolve(a + b),
})

const observable = cache.getObservable(1, 2)

observable.subscribe(({ status, value }) => {
  console.log(`Cache status: ${status}, Value: ${value}`)
})
```
