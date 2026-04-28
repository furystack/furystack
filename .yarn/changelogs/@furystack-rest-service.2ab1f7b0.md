<!-- version-type: patch -->

# @furystack/rest-service

## ⬆️ Dependencies

- Bump `ajv` to `^8.20.0`.
- Bump dev `vitest` to `^4.1.5`.

## 📚 Documentation

- Rewrote JSDoc across the public API — built-in actions (`getCurrentUser`, `isAuthenticated`, `logout`, `passwordLoginAction`, `errorAction`, `notFoundAction`), `authenticate`, `authorize`, `validate`, `HttpAuthenticationSettings`, `HttpUserContext`, the login response strategy, and the request-action implementation — to follow the new value-test guidance: dropped restate-the-type narration, kept intent / trade-offs / constraints around session handling, validation, and error mapping.
