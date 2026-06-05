<!-- version-type: patch -->

# @furystack/redis-store

## ✨ Features

### `find()` and `count()` are now supported

Previously both threw `NotSupportedError`. `RedisStore` now tracks each store's primary keys in a per-store index Set and implements `find()` / `count()` by loading the store's entities through that index and applying filtering, ordering, projection (`select`), and paging (`top` / `skip`) in memory — reusing `@furystack/core`'s `filterItems` / `selectFields`.

This is an O(store-size) scan per call, suitable for control-plane lookups. High-cardinality query workloads should still use `@furystack/mongodb-store` / `@furystack/sequelize-store`, which push the query to the server.

### `update()` is now a partial merge

`update(id, data)` accepts `Partial<T>` and does a read-modify-write merge: it loads the current value, shallow-merges `data` over it, and writes the result back, matching the `PhysicalStore` contract and `InMemoryStore` semantics. The GET and SET are separate commands, so it is **not** atomic against concurrent writes to the same key (last write wins).

### Configurable `keyPrefix` for client sharing

`defineRedisStore` accepts a new optional `keyPrefix` (defaults to the store `name`). Entities are stored under `${keyPrefix}:e:${id}` with the index Set at `${keyPrefix}:keys`, so multiple stores — and other consumers such as the bus and task queue — can share a single Redis client without key collisions.

> **Note (key layout):** the namespaced key layout (`${keyPrefix}:e:${id}`) is not wire-compatible with the previous bare-key format. Data written by an earlier version is not visible after upgrading.
