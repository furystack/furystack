<!-- version-type: major -->

# @furystack/mongodb-store

## 💥 Breaking Changes

Stores are now first-class DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed `useMongoDb(...)`. Declare the store at module scope with `defineMongoDbStore<T, PK>({ name, model, primaryKey, url, db, collection, options? })`.
- `MongoClientFactory` is now an exported interface + `defineService({ lifetime: 'singleton' })` token. It pools `MongoClient` instances per URL and closes every pooled client on injector teardown.
- Dropped the unused `EventHub<{ onClientCreated, onDisposed }>` surface from the factory (no consumers in-repo).
