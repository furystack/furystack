<!-- version-type: major -->

# @furystack/core

## 💥 Breaking Changes

Stores are now first-class DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed `StoreManager`, `addStore(injector, store)`. Declare stores with `defineStore({ name, model, primaryKey, factory })` at module scope — the returned `StoreToken<T, PK>` is self-disposing on injector teardown and carries `model` + `primaryKey` metadata.
- Added `IdentityContext` as an interface + singleton token (previously a class). Bind a concrete implementation at app bootstrap; `useSystemIdentityContext` still returns a child injector with an elevated identity and is the recommended server-side elevation path.
- `Constructable` now lives in this package (moved from `@furystack/inject`). Any downstream package that used `Constructable` must switch its import.
