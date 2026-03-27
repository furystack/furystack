# Changelog

## [10.0.8] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [10.0.7] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [10.0.6] - 2026-03-19

### ✨ Features

- Updated `@furystack/core` dependency to the latest major version.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [10.0.5] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [10.0.4] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`
- Updated `@furystack/rest-service` dependency

## [10.0.3] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [10.0.2] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/rest-service` with new EventHub-based error handling and server lifecycle events
- Updated `@furystack/rest-service` with improved error handling for malformed requests

## [10.0.1] - 2026-02-27

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

## [10.0.0] - 2026-02-26

### 💥 Breaking Changes

### Token verification moved from Google tokeninfo endpoint to local JWT validation

The package now uses `google-auth-library` (`OAuth2Client.verifyIdToken()`) to verify Google ID tokens locally instead of calling Google's `https://www.googleapis.com/oauth2/v3/tokeninfo` HTTP endpoint. This validates the JWT signature, audience, issuer, and expiry without a network round-trip.

### `GoogleLoginSettings` class removed — use `useGoogleAuthentication()` instead

`GoogleLoginSettings` has been removed. Its user-lookup logic and configuration have been merged into `GoogleLoginService`. Setup now requires the new `useGoogleAuthentication()` helper, which accepts a required `clientId`:

```typescript
// ❌ Before
const settings = injector.getInstance(GoogleLoginSettings)
settings.getUserFromGooglePayload = async (payload) => {
  /* ... */
}

// ✅ After
import { useGoogleAuthentication } from '@furystack/auth-google'

useGoogleAuthentication(injector, { clientId: 'YOUR_CLIENT_ID' })
```

### `GoogleApiPayload` type removed — use `TokenPayload` from `google-auth-library`

The custom `GoogleApiPayload` interface has been replaced by the `TokenPayload` type re-exported from `google-auth-library`. The `sub` field is now a `string` (was `number`).

```typescript
// ❌ Before
import type { GoogleApiPayload } from '@furystack/auth-google'

// ✅ After
import type { TokenPayload } from '@furystack/auth-google'
```

### `GoogleLoginService.login()` removed — use `getGoogleUserData()` + `getUserFromGooglePayload()`

The single `login(token)` method has been split into two steps:

- `getGoogleUserData(token)` — verifies the token and returns the decoded `TokenPayload`
- `getUserFromGooglePayload(payload)` — resolves the local user (overridable)

**Impact:** Direct callers of `GoogleLoginService.login()` must update to the two-step flow. Users of `createGoogleLoginAction()` are not affected.

### `GoogleLoginService` lifetime changed from `scoped` to `explicit`

`GoogleLoginService` must now be registered explicitly via `useGoogleAuthentication()` instead of being auto-created per scope.

### `GoogleLoginAction` replaced by `createGoogleLoginAction(strategy)` factory

The static `GoogleLoginAction` export has been removed. Login actions are now created via a factory that accepts a `LoginResponseStrategy`, decoupling Google authentication from the session/token mechanism.

**Examples:**

```typescript
// ❌ Before
import { GoogleLoginAction } from '@furystack/auth-google'

await useRestService({
  injector,
  api: myApi,
  actions: {
    '/login/google': GoogleLoginAction, // hardcoded to cookie sessions
  },
})

// ✅ After — cookie-based sessions
import { createGoogleLoginAction } from '@furystack/auth-google'
import { createCookieLoginStrategy } from '@furystack/rest-service'

const cookieStrategy = createCookieLoginStrategy(injector)

await useRestService({
  injector,
  api: myApi,
  actions: {
    '/login/google': createGoogleLoginAction(cookieStrategy),
  },
})

// ✅ After — JWT tokens
import { createGoogleLoginAction } from '@furystack/auth-google'
import { createJwtLoginStrategy } from '@furystack/auth-jwt'

const jwtStrategy = createJwtLoginStrategy(injector)

await useRestService({
  injector,
  api: myApi,
  actions: {
    '/login/google': createGoogleLoginAction(jwtStrategy),
  },
})
```

**Impact:** All usages of `GoogleLoginAction` must be updated to use `createGoogleLoginAction(strategy)`.

**Migration:**

1. Choose a login response strategy (`createCookieLoginStrategy` for cookie sessions, `createJwtLoginStrategy` for JWT tokens)
2. Replace `GoogleLoginAction` with `createGoogleLoginAction(strategy)`
3. The return type is inferred from the strategy — update your API type definitions if needed

### ✨ Features

### `useGoogleAuthentication()` setup helper

New entry point for configuring Google authentication. Validates the required `clientId` and registers a configured `GoogleLoginService` instance on the injector.

### Browser-side GIS helpers (`./client` sub-export)

New `@furystack/auth-google/client` entry point for browser-only code (no server-side imports):

- `loadGoogleIdentityServices()` — dynamically loads the GIS script (idempotent)
- `initializeGoogleAuth(options)` — loads GIS and calls `google.accounts.id.initialize()`, returns controls for rendering buttons and prompts
- `googleLogin(options)` — POSTs the Google ID token to a backend endpoint with `credentials: 'include'`
- Type definitions: `GoogleCredentialResponse`, `GoogleIdentityOptions`, `GsiButtonConfiguration`, `GoogleAccountsId`, `GoogleAuthControls`, `GoogleLoginOptions`

### Optional CSRF token validation

Added `enableCsrfCheck` option to `GoogleLoginService`. When enabled, the login action validates the `g_csrf_token` double-submit cookie sent by Google Identity Services before processing the login.

### Strategy-based login actions

`createGoogleLoginAction(strategy)` accepts a `LoginResponseStrategy<TResult>` and returns a fully typed `RequestAction`. The result type is inferred from the strategy, enabling type-safe JWT or cookie login endpoints from Google authentication.

### 📚 Documentation

- Rewrote README with updated server setup guide, client setup examples, and token payload reference

### 🧪 Tests

- Rewrote `GoogleLoginService` tests for the new `google-auth-library`-based verification flow
- Rewrote `createGoogleLoginAction` tests for the two-step token verification and user lookup
- Added tests for CSRF validation (matching tokens, mismatched tokens, missing cookie, disabled check)
- Added tests for new client helpers (`initializeGoogleAuth`, `googleLogin`, `loadGoogleIdentityServices`)
- Rewrote `google-login-action.spec.ts` to test the factory pattern with mock strategies, custom result types, and error propagation

### ⬆️ Dependencies

- Added `google-auth-library` ^10.6.1 for local Google ID token verification
- Bumped `@types/node` from ^25.3.0 to ^25.3.1

### 🔧 Chores

- Normalized line endings in `tsconfig.json` and `google-login-service.spec.ts`

## [9.0.41] - 2026-02-26

### ♻️ Refactoring

- `GoogleLoginSettings` now uses `DataSet` and `SystemIdentityContext` instead of direct `PhysicalStore` access for user lookups

### 🧪 Tests

- Updated test setup to register DataSets for `User`, `DefaultSession`, `PasswordCredential`, and `PasswordResetToken`

### 📦 Dependencies

- Added `@furystack/repository` for repository layer enforcement

## [9.0.40] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [9.0.39] - 2026-02-20

### ⬆️ Dependencies

- Updated `@furystack/repository` and `@furystack/rest-service` dependencies

## [9.0.38] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [9.0.37] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Updated `@furystack/rest-service` dependency
- Updated internal dependencies

## [9.0.36] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [9.0.35] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [9.0.34] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors
- Updated `@furystack/rest-service` dependency

## [9.0.33] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Expanded README with detailed setup instructions and usage examples

### 🔧 Chores

- Migrated to centralized changelog management system
