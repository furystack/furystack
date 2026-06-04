<!-- version-type: patch -->

# @furystack/redis-cross-node-bus

## 👷 CI

- Raised the minimum supported Node.js to `>=24.0.0` (Node 24 LTS) in `engines`, dropping Node 22.

## ⬆️ Dependencies

### Upgraded `redis` to v6

Bumped `redis` from `^5.12.1` to `^6.0.0`. node-redis v6 defaults to the RESP3 protocol and adds a 5s default `commandTimeout`. The adapter relies on Redis Streams (`XADD` / `XREAD`), not pub/sub, and its blocking `XREAD` loop uses a 200ms `BLOCK` — well within the new timeout — so the upgrade is transparent for consumers.

- Bumped dev `vitest` to `^4.1.8`.

## ♻️ Refactoring

- Typed the `client` option (`RedisCrossNodeBusOptions['client']`) via redis's exported `RedisClientType` alias instead of `ReturnType<typeof createClient>`, which no longer matches a real `createClient({ url })` result under redis v6's RESP3-defaulted generics. Callers passing a connected `createClient(...)` instance are unaffected.
