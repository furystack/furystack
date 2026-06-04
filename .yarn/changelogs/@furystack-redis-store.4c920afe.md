<!-- version-type: patch -->

# @furystack/redis-store

## ⬆️ Dependencies

### Upgraded `redis` to v6

Bumped `redis` from `^5.12.1` to `^6.0.0`. node-redis v6 defaults to the RESP3 protocol and ships new client defaults (`commandTimeout` 5s, `keepAliveInitialDelay` 30s). The store issues only `GET` / `SET` / `DEL`, which are unaffected by the protocol switch, so no behavior changes for consumers.

- Bumped dev `vitest` to `^4.1.8`.

## ♻️ Refactoring

- Typed the `client` option (`DefineRedisStoreOptions['client']`) via redis's exported `RedisClientType` alias instead of `ReturnType<typeof createClient>`. Under redis v6 the latter widens its generics and no longer matches a real `createClient({ url })` result. Callers passing a connected `createClient(...)` instance are unaffected.
