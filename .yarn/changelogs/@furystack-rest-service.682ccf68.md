<!-- version-type: minor -->

# @furystack/rest-service

## ✨ Features

### `IdentityEventBus` — cross-node identity invalidation

A typed wrapper over `@furystack/cross-node-bus` that bridges the per-process `UserResolutionCache` to a shared bus, so logouts, role flips, password resets and account deletions invalidate cached identities on every node — not just the one that originated the change. Collapses the staleness window from `userCacheTtlMs` (default 30 s) to bus latency (single-digit ms with Redis pub/sub).

```typescript
import { IdentityEventBus } from '@furystack/rest-service'

const bus = injector.get(IdentityEventBus)
await bus.publish({ type: 'userRolesChanged', username: 'alice' })
// → invalidates every cached entry that resolved to alice on this node
//   AND every sibling node, synchronously locally and at bus speed remotely.
```

Supported event variants (`IdentityEvent`):

- `userLoggedOut` / `sessionInvalidated` — drop the cache entry for a single session id.
- `userRolesChanged` / `userDeleted` / `passwordChanged` — drop every cached entry that resolved to the named user, regardless of which session originally populated it.

**Self-delivery contract:** `publish()` applies the matching local invalidation and fires local subscribers synchronously **before** awaiting the bus broadcast. Sibling nodes receive the message via a `subscribeRemoteOnly` bridge — own publishes never round-trip through the transport, so duplicate work is impossible.

`HttpUserContext.cookieLogout` now broadcasts `userLoggedOut` on the bus instead of dropping the local cache directly. Apps that have not bound a transport adapter run against the in-process default `CrossNodeBus` and behave exactly as before.

### `UserResolutionCache.invalidateByUser(username)`

Drops every cached entry that resolved to `username`, backed by the cache's reverse tag index — no per-call O(n) scan. Use after role / password / account-state changes that must take effect immediately on the next request, instead of waiting for the TTL window to elapse.

```typescript
const userCache = injector.get(UserResolutionCache)
userCache.invalidateByUser('alice')
```

For multi-node deployments, prefer publishing the corresponding `IdentityEvent` on `IdentityEventBus` — it calls `invalidateByUser` locally and on every sibling.

### `identity-cache-keys` exports

New module exporting the cache-key / cache-tag shapes shared by the cookie-auth provider, `UserResolutionCache`, and `IdentityEventBus`:

- `SessionCacheKey` (type) — `` `cookie:${string}` ``.
- `UserCacheTag` (type) — `` `user:${string}` ``.
- `sessionCacheKey(sessionId)` — builds the cookie-auth cache key.
- `userCacheTag(username)` — builds the user-resolution cache tag.

Centralising these strings means the local-vs-replicated invalidation paths cannot drift.

## 📚 Documentation

- Expanded `UserResolutionCache` JSDoc to cross-link `invalidateByUser` and document the multi-node trade-off.

## ⬆️ Dependencies

- Adds `@furystack/cross-node-bus` as a runtime dependency. Resolves to the in-process default bus unless an adapter is bound.
