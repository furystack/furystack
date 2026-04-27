<!-- version-type: patch -->

# @furystack/core

## ✨ Features

### New `NotFoundError` and `NotSupportedError` exports

Two new error classes are exported from the package's `errors` barrel so adapters can signal narrow precondition failures by type instead of by message:

- `NotFoundError` — thrown by a `PhysicalStore` when an operation targets a missing entity (e.g. `update` called with an id that does not exist). Callers can branch on `instanceof NotFoundError` instead of parsing strings.
- `NotSupportedError` — thrown when an adapter cannot serve a given operation against its backing storage (e.g. `find` against a key/value store). Adapters throw at call time rather than at construction so the rest of the surface remains usable.

`InMemoryStore.update` now throws `NotFoundError` for the missing-entity case (was a plain `Error`); the message was tightened from `... cannot update!` to `... cannot update`. Sibling adapters (`@furystack/mongodb-store`, `@furystack/sequelize-store`, `@furystack/redis-store`) were updated in lockstep.

**Impact:** code that matched on the previous error message will keep working — `Error.message` still contains the entity id and the `cannot update` substring, only the trailing `!` was dropped. Callers can now switch to `instanceof NotFoundError`.

## 📚 Documentation

- Rewrote JSDoc across the public API (`defineStore`, `InMemoryStore`, `PhysicalStore`, the `errors/` family, `IdentityContext`, `globalDisposables`, `filterItems`, `User`) to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints, and added type-only imports for cross-file `{@link}` targets.

## ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.
