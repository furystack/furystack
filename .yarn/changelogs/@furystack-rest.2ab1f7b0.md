<!-- version-type: patch -->

# @furystack/rest

## 📚 Documentation

- Rewrote JSDoc on the endpoint models (`GetEndpoint`, `GetCollectionEndpoint`, `PostEndpoint`, `PatchEndpoint`, `DeleteEndpoint`), `ApiEndpointSchema`, `RequestError`, and the (de)serialize helpers to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints (e.g. how `Validate()` and `Authenticate()` populate the schema metadata).

## ⬆️ Dependencies

- Bump dev `vitest` to `^4.1.5`.
