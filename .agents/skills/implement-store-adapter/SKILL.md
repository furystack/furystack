---
name: implement-store-adapter
description: Implement a new physical store backend (e.g. file system, MongoDB, Redis, custom) for FuryStack and expose it via a `defineXxxStore` helper. Use only when the user asks to add a new store/adapter package or extend an existing one with a new backend.
---

# implement-store-adapter

Author a new `PhysicalStore<T, PK>` implementation and the `defineXxxStore` helper that wraps it in a singleton `StoreToken`. Read `.cursor/rules/LIBRARY_DEVELOPMENT.mdc` first; this skill owns the workflow.

## Step 1 — Confirm scope

Ask the user:

- Backend name (e.g. `redis`, `mongodb`, `sequelize`)
- Package: new package `@furystack/<backend>-store`, or extend an existing one?
- Sync or async disposal?
- Connection lifecycle: shared client (singleton) vs per-store?

If unsure where the package goes, default: `packages/<backend>-store/`.

## Step 2 — Define the contract

Implement the `PhysicalStore<T, TPrimaryKey>` interface:

| Method                                        | Signature                                                         |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `add`                                         | `(entries: WithOptionalId<T, PK>[]) => Promise<{ created: T[] }>` |
| `update`                                      | `(id: T[PK], change: Partial<T>) => Promise<void>`                |
| `remove`                                      | `(...ids: T[PK][]) => Promise<void>`                              |
| `find`                                        | `(filter: FindOptions<T, K>) => Promise<Pick<T, K>[]>`            |
| `get`                                         | `(id: T[PK], select?: K[]) => Promise<Pick<T, K> \| undefined>`   |
| `count`                                       | `(filter?: Filter<T>) => Promise<number>`                         |
| `[Symbol.dispose]` or `[Symbol.asyncDispose]` | resource cleanup                                                  |

Plus the `model: Constructor<T>` and `primaryKey: PK` properties.

Reference: `packages/core/src/in-memory-store.ts`.

## Step 3 — Translate filters

Map FuryStack `FindOptions` to backend query language:

- `filter` → backend `where` / index lookup
- `top`, `skip` → pagination
- `order` → `sort`
- `select` → projection
- `group` (if backend supports it)

Keep the translation in a pure helper (`translate-filter.ts`) so it's unit-testable in isolation.

## Step 4 — Author `defineXxxStore`

Wrap `defineService({ lifetime: 'singleton' })` and tag with model + primaryKey metadata so DataSets and endpoint generators can introspect.

```typescript
import { defineService } from '@furystack/inject'
import type { Constructor } from '@furystack/utils'

export type DefineXxxStoreOptions<T, PK extends keyof T> = {
  name: string
  model: Constructor<T>
  primaryKey: PK
  // backend-specific options:
  client: XxxClient
  collection: string
}

export const defineXxxStore = <T, PK extends keyof T>(
  options: DefineXxxStoreOptions<T, PK>,
) =>
  defineService({
    name: options.name,
    lifetime: 'singleton',
    factory: ({ onDispose }) => {
      const store = new XxxStore({ ... })
      onDispose(() => store[Symbol.asyncDispose]())
      return store
    },
  })
```

If TS widens `TPrimaryKey` to `keyof T` through the helper, the user must pass explicit generics: `defineXxxStore<User, 'username'>({ ... })`. Document this in the JSDoc.

## Step 5 — Throw-by-default tokens (optional)

If your package ships consumer-facing tokens (e.g. `UserStore` exported from a higher-level package), the default factory should throw `NotConfiguredError` so apps must `bind` an implementation. Your `defineXxxStore` helper provides the binding.

## Step 6 — Disposal

- Close connections / flush buffers in `[Symbol.asyncDispose]` (or sync equivalent)
- Wire it through the factory's `onDispose` so the injector tears down the store on shutdown
- Test that double-dispose is a no-op

## Step 7 — Tests

Run `write-tests` skill or follow `TESTING_GUIDELINES.mdc`:

- Unit-test the filter translator with diverse `FindOptions`
- Integration-test the full CRUD round-trip against a real (or in-memory mocked) backend
- Test disposal: store rejects further calls, connection closed
- Test concurrency: `getOrCreate`-style races if relevant
- Wrap every `Injector` / store in `usingAsync`

## Step 8 — Document + export

- `index.ts` exports: `defineXxxStore`, the `XxxStore` class (only if useful for advanced consumers), and the options type
- JSDoc with `@example` covering the `defineXxxStore` happy path and the explicit-generics escape hatch
- README in the package describing connection options, pitfalls, performance characteristics

## Step 9 — Versioning + changelog

- Major version if this changes existing `PhysicalStore` contract
- Minor version for a new backend in an existing package
- New package: start at `1.0.0`
- Run `fill-changelog` skill or write the entry manually following `.cursor/agents/reviewer-changelog.md` standards

## Step 10 — Verify

```bash
yarn build
yarn test packages/<backend>-store
yarn lint
```

Fix every `@furystack/eslint-plugin` violation, especially `require-disposable-for-observable-owner` and `prefer-using-wrapper`.

## Output

Report:

- Package created / modified
- New tokens / classes exported
- Test coverage delta
- Migration notes if existing API changed
