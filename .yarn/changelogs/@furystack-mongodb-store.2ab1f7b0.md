<!-- version-type: patch -->

# @furystack/mongodb-store

## ♻️ Refactoring

### `update` throws `NotFoundError` for missing entities

`MongodbStore.update` now throws `NotFoundError` from `@furystack/core` (instead of a plain `Error`) when no document matches the given id. Callers can branch on `instanceof NotFoundError` without parsing messages. The message was tightened from `... cannot update!` to `... cannot update` — substring matches that look for `cannot update` keep working.

## ⬆️ Dependencies

- Bump `mongodb` to `7.2.0`.
- Bump dev `vitest` to `^4.1.5`.

## 📚 Documentation

- Rewrote JSDoc on `MongodbStore`, `defineMongodbStore`, and `MongoClientFactory` to follow the new value-test guidance: dropped restate-the-type narration, called out the lazy-init contract, the `_id`/`ObjectId` coercion behavior, and the fact that the store has no `[Symbol.asyncDispose]` because client lifetime belongs to the factory.
