<!-- version-type: major -->

# @furystack/sequelize-store

## 💥 Breaking Changes

Stores are now first-class DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed `useSequelize(...)`. Declare the store at module scope with `defineSequelizeStore<T, M, PK>({ name, model, sequelizeModel, primaryKey, options, initModel? })`.
- `SequelizeClientFactory` is now an exported interface + `defineService({ lifetime: 'singleton' })` token. Clients are pooled by `JSON.stringify(options)` and closed on injector teardown.
