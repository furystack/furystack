# Changelog

## [12.0.0] - 2026-06-05

### 👷 CI

- Raised the minimum supported Node.js to `>=24.0.0` (Node 24 LTS) in `engines`, dropping Node 22.

### ⬆️ Dependencies

### Upgraded `redis` to v6

Bumped `redis` from `^5.12.1` to `^6.0.0`. node-redis v6 defaults to the RESP3 protocol and ships new client defaults (`commandTimeout` 5s, `keepAliveInitialDelay` 30s). The store issues only `GET` / `SET` / `DEL`, which are unaffected by the protocol switch, so no behavior changes for consumers.

- Bumped dev `vitest` to `^4.1.8`.

### ♻️ Refactoring

- Typed the `client` option (`DefineRedisStoreOptions['client']`) via redis's exported `RedisClientType` alias instead of `ReturnType<typeof createClient>`. Under redis v6 the latter widens its generics and no longer matches a real `createClient({ url })` result. Callers passing a connected `createClient(...)` instance are unaffected.

### 💥 Breaking Changes

### Namespaced key layout (not wire-compatible with prior versions)

Entities are now stored under `${keyPrefix}:e:${id}` with a per-store primary-key index Set at `${keyPrefix}:keys`, where `keyPrefix` defaults to the store `name`. The previous bare-key format is **not** readable under the new layout — data written by an earlier version is invisible after upgrading.

**Impact:** Any deployment with existing data in a Redis-backed store.

**Migration:** Re-seed the store, or run a one-off migration that copies each existing bare key into `${name}:e:${id}` and rebuilds the `${name}:keys` index Set. If you cannot migrate, pin to the previous major.

### ✨ Features

### `find()` and `count()` are now supported

Previously both threw `NotSupportedError`. `RedisStore` now tracks each store's primary keys in a per-store index Set and implements `find()` / `count()` by loading the store's entities through that index and applying filtering, ordering, projection (`select`), and paging (`top` / `skip`) in memory — reusing `@furystack/core`'s `filterItems` / `selectFields`.

This is an O(store-size) scan per call, suitable for control-plane lookups. High-cardinality query workloads should still use `@furystack/mongodb-store` / `@furystack/sequelize-store`, which push the query to the server.

### `update()` is now a partial merge

`update(id, data)` accepts `Partial<T>` and does a read-modify-write merge: it loads the current value, shallow-merges `data` over it, and writes the result back, matching the `PhysicalStore` contract and `InMemoryStore` semantics. The GET and SET are separate commands, so it is **not** atomic against concurrent writes to the same key (last write wins).

### Configurable `keyPrefix` for client sharing

`defineRedisStore` accepts a new optional `keyPrefix` (defaults to the store `name`). Entities are stored under `${keyPrefix}:e:${id}` with the index Set at `${keyPrefix}:keys`, so multiple stores — and other consumers such as the bus and task queue — can share a single Redis client without key collisions.

> **Note (key layout):** the namespaced key layout (`${keyPrefix}:e:${id}`) is not wire-compatible with the previous bare-key format. Data written by an earlier version is not visible after upgrading.

## [11.0.1] - 2026-05-21

### ♻️ Refactoring

### `count` and `find` throw `NotSupportedError`

`RedisStore.count` and `RedisStore.find` now throw `NotSupportedError` from `@furystack/core` (instead of a plain `Error('Not supported :(')`) with descriptive messages. Callers can branch on `instanceof NotSupportedError` without parsing the legacy emoji-tagged string. Code that already wrapped these calls in `try/catch` keeps working.

### ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.
- Bumped `@types/node` to `^25.9.1` and `vitest` to `^4.1.7`. No source changes — dev-tooling bump only.

### 📚 Documentation

- Rewrote JSDoc on `RedisStore` and `defineRedisStore` to follow the new value-test guidance: dropped restate-the-type narration, called out the contract deviation (no generic query surface, no in-memory mirror) and the fact that client ownership stays with the caller — the store never connects or quits the client.

## [11.0.0] - 2026-04-25

### 💥 Breaking Changes

Stores are now first-class DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed `useRedis(...)`. Declare the store at module scope with `defineRedisStore<T, PK>({ name, model, primaryKey, client })`.
- The caller still owns the `redis` client lifecycle (`connect` / `quit`); the store just reads/writes through it.

## [10.0.48] - 2026-04-17

### ⬆️ Dependencies

- Raised the `redis` client dependency to ^5.12.1 and dev `@types/node` to ^25.6.0, `typescript` to ^6.0.3, and `vitest` to ^4.1.4.

## [10.0.47] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [10.0.46] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [10.0.45] - 2026-03-19

### ✨ Features

- Updated `@furystack/core` dependency to the latest major version.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [10.0.44] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [10.0.43] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`

## [10.0.42] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [10.0.41] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/utils` with EventHub listener error handling

## [10.0.40] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [10.0.39] - 2026-02-26

### 📝 Documentation

- Added tip about wrapping the physical store with a Repository DataSet for application-level data access

## [10.0.38] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [10.0.37] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core` and `redis`

## [10.0.36] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Updated internal dependencies

## [10.0.35] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

### 🧪 Tests

- Refactored `RedisStore` tests to use `usingAsync` for proper `Injector` disposal

## [10.0.34] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [10.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [10.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system
