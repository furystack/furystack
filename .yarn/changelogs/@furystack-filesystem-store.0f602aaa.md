<!-- version-type: major -->

# @furystack/filesystem-store

## 💥 Breaking Changes

Stores are now first-class DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed `useFileSystemStore(...)`. Declare the store at module scope with `defineFileSystemStore<T, PK>({ name, model, primaryKey, fileName, tickMs? })` — the returned `StoreToken<T, PK>` is self-disposing.
- Disposal (tick interval, file-system watcher, final flush) now runs through the token's `onDispose` hook on injector teardown.
