<!-- version-type: patch -->

# @furystack/sequelize-store

## ♻️ Refactoring

### `update` throws `NotFoundError` for missing entities

`SequelizeStore.update` now throws `NotFoundError` from `@furystack/core` (instead of a plain `Error('Entity not found')`) when zero rows match the primary key. The new message also includes the offending id (`Entity not found with id 'X', cannot update`) so logs are actionable. Callers can branch on `instanceof NotFoundError` without parsing messages — string matches on the bare `Entity not found` keep working as a substring.

## ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.

## 📚 Documentation

- Rewrote JSDoc on `SequelizeStore`, `SequelizeStoreSettings`, and `defineSequelizeStore` to follow the new value-test guidance: dropped restate-the-type narration, called out the lazy-init + memoized `initModel` contract, and the fact that the store has no `[Symbol.asyncDispose]` because client lifetime belongs to `SequelizeClientFactory`.
