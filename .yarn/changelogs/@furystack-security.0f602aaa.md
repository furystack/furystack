<!-- version-type: major -->

# @furystack/security

## 💥 Breaking Changes

Password policy, hasher, and authenticator are now DI tokens, not `@Injectable` classes. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Removed the `@Injectable`-based `PasswordAuthenticator` and `CryptoPasswordHasher` classes. Resolve them as tokens via `injector.get(PasswordAuthenticator)` / `injector.get(CryptoPasswordHasher)`.
- Added `SecurityPolicy` interface + token. `usePasswordPolicy(injector, overrides?)` binds the settings, the hasher defaults, and the authenticator token.
- `PasswordCredentialStore` and `PasswordResetTokenStore` are now throw-by-default `StoreToken`s. Apps must `injector.bind(…, factory)` a persistent implementation before resolving anything downstream.
