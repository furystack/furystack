<!-- version-type: patch -->

# @furystack/redis-store

## ♻️ Refactoring

### `count` and `find` throw `NotSupportedError`

`RedisStore.count` and `RedisStore.find` now throw `NotSupportedError` from `@furystack/core` (instead of a plain `Error('Not supported :(')`) with descriptive messages. Callers can branch on `instanceof NotSupportedError` without parsing the legacy emoji-tagged string. Code that already wrapped these calls in `try/catch` keeps working.

## ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.

## 📚 Documentation

- Rewrote JSDoc on `RedisStore` and `defineRedisStore` to follow the new value-test guidance: dropped restate-the-type narration, called out the contract deviation (no generic query surface, no in-memory mirror) and the fact that client ownership stays with the caller — the store never connects or quits the client.
