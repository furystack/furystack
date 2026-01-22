# @furystack/cache

A simple caching utility for FuryStack, providing in-memory cache management to improve performance and reduce redundant computations in your applications.

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

// Remove specific range, where the sum is 3 or the arguments are as specified
cache.removeRange((entity, args) => {
  return entity === 3 || (args[0] === 1 && args[1] === 3)
})

cache.flushAll() // Removes all cached items
```

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
