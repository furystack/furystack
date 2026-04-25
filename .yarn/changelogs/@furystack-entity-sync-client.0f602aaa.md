<!-- version-type: major -->

# @furystack/entity-sync-client

## 💥 Breaking Changes

The client entity-sync service is now a per-app DI token. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed the `@Injectable({ lifetime: 'explicit' })` decorator on `EntitySyncService`. The class constructor is unchanged, so `new EntitySyncService(opts)` still works for tests or non-DI integrations.
- Added `defineEntitySyncService(options)` — mints a per-app singleton token (pattern shared with `defineI18N`). The factory instantiates the service once and registers `onDispose` for `Symbol.dispose`.
- Added `createSyncHooks(syncToken)` — factory that returns Shades hooks (`{ useEntitySync, useCollectionSync }`) bound to the caller-supplied token. The shared hooks previously exported from the root module are gone.
- `Constructable` import moved from `@furystack/inject` to `@furystack/core`. This package now has a direct dependency on `@furystack/core`.
