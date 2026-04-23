<!-- version-type: major -->

# @furystack/redis-store

## 💥 Breaking Changes

Stores are now first-class DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed `useRedis(...)`. Declare the store at module scope with `defineRedisStore<T, PK>({ name, model, primaryKey, client })`.
- The caller still owns the `redis` client lifecycle (`connect` / `quit`); the store just reads/writes through it.
