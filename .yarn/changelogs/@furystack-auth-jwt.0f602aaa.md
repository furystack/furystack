<!-- version-type: major -->

# @furystack/auth-jwt

## 💥 Breaking Changes

JWT settings, token service, and refresh store are now DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Added `JwtAuthenticationSettings` interface + singleton token (default factory throws `JwtAuthenticationNotConfiguredError`). `useJwtAuthentication(injector, { secret, ... })` binds the settings, validates the secret length, and appends the Bearer provider to `HttpAuthenticationSettings`.
- Added `JwtTokenService` interface + singleton token. The factory captures a single system-identity scope and registers `onDispose` for teardown.
- `RefreshTokenStore` / `RefreshTokenDataSet` are now throw-by-default tokens. Apps must bind a persistent implementation before resolving anything that depends on them.
- Login / refresh / logout actions now resolve services via `injector.get(...)` rather than decorator-injected fields. No import-site changes on the REST wiring side.
- `fingerprintCookie` overrides are shallow-merged: callers only pass the keys they want to change.
