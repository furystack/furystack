<!-- version-type: major -->

# @furystack/auth-google

## 💥 Breaking Changes

Google authentication settings and login service are now DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Added `GoogleAuthenticationSettings` interface + singleton token (default factory throws `GoogleAuthenticationNotConfiguredError`). `useGoogleAuthentication(injector, { clientId, enableCsrfCheck?, getUserFromGooglePayload? })` validates the client ID and binds the settings.
- Added `GoogleLoginService` interface + singleton token. The factory builds a shared `OAuth2Client`, captures a system-identity scope, and registers `onDispose` for teardown.
- `createGoogleLoginAction(strategy)` resolves `GoogleLoginService` from the per-request injector. The CSRF double-submit cookie check is opt-in via `enableCsrfCheck`.
