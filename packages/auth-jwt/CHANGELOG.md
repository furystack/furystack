# Changelog

## [4.0.0] - 2026-04-25

### 💥 Breaking Changes

JWT settings, token service, and refresh store are now DI tokens. See the [v7 migration guide](../../docs/migrations/v7-functional-di.md) for rationale, recipes, and pitfalls.

- Added `JwtAuthenticationSettings` interface + singleton token (default factory throws `JwtAuthenticationNotConfiguredError`). `useJwtAuthentication(injector, { secret, ... })` binds the settings, validates the secret length, and appends the Bearer provider to `HttpAuthenticationSettings`.
- Added `JwtTokenService` interface + singleton token. The factory captures a single system-identity scope and registers `onDispose` for teardown.
- `RefreshTokenStore` / `RefreshTokenDataSet` are now throw-by-default tokens. Apps must bind a persistent implementation before resolving anything that depends on them.
- Login / refresh / logout actions now resolve services via `injector.get(...)` rather than decorator-injected fields. No import-site changes on the REST wiring side.
- `fingerprintCookie` overrides are shallow-merged: callers only pass the keys they want to change.

## [3.0.0] - 2026-04-22

### 💥 Breaking Changes

### Removed the legacy `JwtLoginAction`

The static `JwtLoginAction` has been removed. Use `createJwtLoginAction(injector)` (or compose directly: `createPasswordLoginAction(createJwtLoginStrategy(injector))`) instead. The factory captures the JWT auth services once at setup time; the old static action resolved them from the request-scoped injector on every call.

**Impact:** `import { JwtLoginAction } from '@furystack/auth-jwt'` will fail.

**Migration:**

```ts
import { createJwtLoginAction } from '@furystack/auth-jwt'

// old:
// '/jwt/login': JwtLoginAction,
// new:
'/jwt/login': createJwtLoginAction(injector),
```

### Removed legacy callback options on `createJwtTokenStore`

The deprecated `onAccessTokenChanged`, `onRefreshTokenChanged`, and `onRefreshFailed` option fields on `JwtTokenStoreOptions` have been removed. Subscribe through the returned store's EventHub API instead. This unifies the token-store events with the rest of the EventHub-based primitives and supports multiple subscribers per event.

**Impact:** Passing any of these options to `createJwtTokenStore(...)` is no longer accepted by the `JwtTokenStoreOptions` type.

**Migration:**

```ts
const store = createJwtTokenStore({ login, refresh, logout })

store.subscribe('onAccessTokenChanged', (accessToken) => save('access', accessToken))
store.subscribe('onRefreshTokenChanged', (refreshToken) => save('refresh', refreshToken))
store.subscribe('onRefreshFailed', ({ error }) => console.error(error))
```

Note: the `onRefreshFailed` event payload is `{ error }` (wrapped), whereas the legacy callback was invoked with the raw `error`. Destructure accordingly.

### ♻️ Refactoring

- Removed a double-cast (`as Parameters<typeof innerClient>[0]`) when forwarding options from `createJwtClient().call()` into the inner `createClient` call. The spread result is now assigned to a typed local variable first, so the typed REST client signature is preserved without an assertion. This keeps `@furystack/auth-jwt` compliant with the new `furystack/rest-no-type-cast` rule shipped in `@furystack/eslint-plugin`.

## [2.1.7] - 2026-04-17

### ⬆️ Dependencies

- Raised `@types/node` to ^25.6.0, `typescript` to ^6.0.3, and `vitest` to ^4.1.4 so package development matches the workspace toolchain.

## [2.1.6] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [2.1.5] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [2.1.4] - 2026-03-19

### ✨ Features

- Updated `@furystack/core` dependency to the latest major version.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [2.1.3] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [2.1.2] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`
- Updated `@furystack/rest-service` dependency

## [2.1.1] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [2.1.0] - 2026-03-03

### 🗑️ Deprecated

- `onAccessTokenChanged` option — use `subscribe('onAccessTokenChanged', ...)` on the returned store instead
- `onRefreshTokenChanged` option — use `subscribe('onRefreshTokenChanged', ...)` on the returned store instead
- `onRefreshFailed` option — use `subscribe('onRefreshFailed', ...)` on the returned store instead

### ✨ Features

### EventHub-based token store events

`createJwtTokenStore` now uses an internal `EventHub` and exposes `subscribe`, `addListener`, and `removeListener` methods. This allows multiple consumers to observe token changes and refresh failures without passing callbacks through options.

```typescript
const store = createJwtTokenStore({ login, refresh })

store.subscribe('onAccessTokenChanged', (token) => {
  console.log('Access token changed:', token)
})

store.subscribe('onRefreshFailed', ({ error }) => {
  console.error('Refresh failed:', error)
})
```

The store is now `Disposable` via `Symbol.dispose`, which cleans up all internal listeners.

### 🧪 Tests

- Added tests for EventHub event emission (`onAccessTokenChanged`, `onRefreshTokenChanged`, `onRefreshFailed`)
- Added tests for `Symbol.dispose` cleanup

### ⬆️ Dependencies

- Updated `@furystack/rest-service` with improved error handling for malformed requests

## [2.0.1] - 2026-02-27

### ⬆️ Dependencies

- Updated `@furystack/rest-service` dependency

## [2.0.0] - 2026-02-26

### 💥 Breaking Changes

### `signAccessToken()` Return Type Changed

`JwtTokenService.signAccessToken()` now returns `{ token: string; fingerprint: string | null }` instead of a plain `string`. This enables the new fingerprint cookie protection feature.

**Examples:**

```typescript
// ❌ Before
const accessToken = tokenService.signAccessToken(user)

// ✅ After
const { token: accessToken, fingerprint } = tokenService.signAccessToken(user)
```

**Impact:** All code calling `signAccessToken()` directly must destructure the result. Server actions (`JwtLoginAction`, `JwtRefreshAction`) have been updated internally.

### `createJwtClient()` Signature Changed to Options Object with Token Store

`createJwtClient` no longer accepts positional `loginEndpoint`, `refreshEndpoint`, and `logoutEndpoint` parameters. Instead, it takes a single options object with a required `tokenStore` property.

The token store is created separately via the new `createJwtTokenStore()` factory, which handles login, logout, refresh, and token state independently.

**Examples:**

```typescript
// ❌ Before
import { createJwtClient } from '@furystack/auth-jwt/client'

const client = createJwtClient<MyApi>(
  { endpointUrl: 'https://api.example.com' },
  '/jwt/login',
  '/jwt/refresh',
  '/jwt/logout',
)

await client.login({ username: 'admin', password: 'secret' })
const result = await client.call({ method: 'GET', action: '/me' })
await client.logout()

// ✅ After
import { createJwtTokenStore, createJwtClient } from '@furystack/auth-jwt/client'

const tokenStore = createJwtTokenStore({
  login: (creds) => fetchJson('/jwt/login', creds),
  refresh: (rt) => fetchJson('/jwt/refresh', { refreshToken: rt }),
  logout: (rt) => fetchVoid('/jwt/logout', { refreshToken: rt }),
})

const client = createJwtClient<MyApi>({
  endpointUrl: 'https://api.example.com',
  tokenStore,
})

await tokenStore.login({ username: 'admin', password: 'secret' })
const result = await client.call({ method: 'GET', action: '/me' })
await tokenStore.logout()
```

**Impact:** All `createJwtClient` call sites must be updated. Token lifecycle methods (`login`, `logout`, `setTokens`, `getAccessToken`, `isAuthenticated`) now live on the token store, not on the client.

### Removed Methods from `createJwtClient` Return Value

The following properties were moved from the client to `JwtTokenStore`:

| Removed from client         | Use instead                     |
| --------------------------- | ------------------------------- |
| `client.login(credentials)` | `tokenStore.login(credentials)` |
| `client.logout()`           | `tokenStore.logout()`           |
| `client.getAccessToken()`   | `tokenStore.getAccessToken()`   |
| `client.isAuthenticated`    | `tokenStore.isAuthenticated`    |
| `client.setTokens(pair)`    | `tokenStore.setTokens(pair)`    |

### `JwtClientOptions` Type Changed

The `refreshThresholdSeconds`, `onTokenRefreshed`, and `onRefreshFailed` properties were removed. A required `tokenStore: JwtTokenStore` property was added.

```typescript
// ❌ Before
const options: JwtClientOptions = {
  endpointUrl: 'https://api.example.com',
  refreshThresholdSeconds: 120,
  onTokenRefreshed: (tokens) => save(tokens),
  onRefreshFailed: (err) => console.error(err),
}

// ✅ After
const tokenStore = createJwtTokenStore({
  login: ...,
  refresh: ...,
  refreshThresholdSeconds: 120,
  onAccessTokenChanged: (token) => save('access', token),
  onRefreshTokenChanged: (token) => save('refresh', token),
  onRefreshFailed: (err) => console.error(err),
})

const options: JwtClientOptions = {
  endpointUrl: 'https://api.example.com',
  tokenStore,
}
```

### ✨ Features

### Token Fingerprint Cookie Protection (OWASP Token Sidejacking Prevention)

Added HTTP-only cookie-based fingerprinting to prevent JWT theft via XSS. When enabled (the default), a random fingerprint is SHA-256 hashed and embedded as an `fpt` claim in the access token. The raw value is sent as an HTTP-only, Secure, SameSite=Strict cookie. On verification, the cookie value is hashed and compared against the claim using timing-safe comparison.

This means that even if an attacker steals the JWT from JavaScript-accessible storage via XSS, they cannot authenticate without the HTTP-only cookie, which is inaccessible to scripts.

**Configuration (opt-out):**

```typescript
useJwtAuthentication(injector, {
  secret: 'my-secret-at-least-32-bytes-long!',
  // Enabled by default. To disable (e.g. for non-browser clients):
  fingerprintCookie: {
    enabled: false,
    name: 'fpt',
    sameSite: 'Strict',
    secure: true,
    path: '/',
  },
})
```

**New exports:**

- `FingerprintCookieSettings` — Type for the fingerprint cookie configuration
- `buildFingerprintSetCookie(fingerprint, settings)` — Builds a `Set-Cookie` header string for the fingerprint
- `clearFingerprintSetCookie(settings)` — Builds a `Set-Cookie` header string that clears the fingerprint cookie
- `extractFingerprintCookie(request, cookieName)` — Extracts the fingerprint value from a request's `Cookie` header
- `hashFingerprint(raw)` — SHA-256 hashes a raw fingerprint value for embedding in JWT claims

**Client-side:** `createJwtClient` now sets `credentials: 'include'` by default so the browser sends the HTTP-only cookie with every request. This can be overridden via `requestInit.credentials`.

### Standalone `JwtTokenStore` for Multi-Client Token Sharing

Extracted token lifecycle management (login, logout, refresh, expiry tracking) from `createJwtClient` into a new `createJwtTokenStore` factory. Multiple API clients can now share a single token store, avoiding redundant refresh requests and keeping authentication state in sync.

**Usage:**

```typescript
import { createJwtTokenStore, createJwtClient } from '@furystack/auth-jwt/client'

const tokenStore = createJwtTokenStore({
  login: (credentials) => myApi.login(credentials),
  refresh: (refreshToken) => myApi.refresh(refreshToken),
  logout: (refreshToken) => myApi.logout(refreshToken),
  onAccessTokenChanged: (token) => localStorage.setItem('accessToken', token ?? ''),
})

const client = createJwtClient<MyApi>({
  endpointUrl: 'https://api.example.com',
  tokenStore,
})
```

### Change Callbacks on Token State

`createJwtTokenStore` accepts `onAccessTokenChanged`, `onRefreshTokenChanged`, and `onRefreshFailed` callbacks, enabling token persistence and error handling without coupling to a specific storage mechanism.

### `createJwtLoginStrategy(injector)`

Factory that creates a JWT-based `LoginResponseStrategy<{ accessToken: string; refreshToken: string }>`. Signs access and refresh tokens via `JwtTokenService` and includes fingerprint cookie headers when enabled.

```typescript
import { createJwtLoginStrategy } from '@furystack/auth-jwt'
import { createPasswordLoginAction } from '@furystack/rest-service'

const jwtStrategy = createJwtLoginStrategy(injector)
const loginAction = createPasswordLoginAction(jwtStrategy)
// loginAction: RequestAction<{ result: { accessToken: string; refreshToken: string }; body: { username: string; password: string } }>
```

This strategy can be passed to any login action factory (`createPasswordLoginAction`, `createGoogleLoginAction`, etc.) to issue JWT tokens regardless of the authentication mechanism.

### `createJwtLoginAction(injector)`

Convenience factory that composes `createPasswordLoginAction` with `createJwtLoginStrategy` for a ready-to-use JWT password login endpoint. Replaces the deprecated `JwtLoginAction`.

```typescript
import { createJwtLoginAction } from '@furystack/auth-jwt'

const loginAction = createJwtLoginAction(injector)
```

### 🔧 Changed

- `verifyAccessToken()` now accepts an optional second parameter `fingerprint?: string | null` for fingerprint validation
- `createJwtAuthProvider()` accepts an optional `fingerprintCookieName` parameter to enable cookie extraction for fingerprint verification
- `createJwtClient` 401 retry now uses `forceRefresh()` to handle server-side revocation of non-expired tokens

### Migration Guide

### Step 1: Create a Token Store

Replace direct `createJwtClient` calls with a `createJwtTokenStore` + `createJwtClient` pair:

```typescript
import { createJwtTokenStore, createJwtClient } from '@furystack/auth-jwt/client'

const tokenStore = createJwtTokenStore({
  login: async (credentials) => {
    const res = await fetch('/api/jwt/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    return res.json()
  },
  refresh: async (refreshToken) => {
    const res = await fetch('/api/jwt/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    return res.json()
  },
  logout: async (refreshToken) => {
    await fetch('/api/jwt/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
  },
})

const client = createJwtClient<MyApi>({
  endpointUrl: 'https://api.example.com',
  tokenStore,
})
```

### Step 2: Move Lifecycle Calls to the Token Store

```typescript
// Before                          // After
client.login(creds)                tokenStore.login(creds)
client.logout()                    tokenStore.logout()
client.getAccessToken()            tokenStore.getAccessToken()
client.isAuthenticated             tokenStore.isAuthenticated
client.setTokens(pair)             tokenStore.setTokens(pair)
```

### Step 3: Update Server-Side `signAccessToken` Callers (if any)

```typescript
// Before
const accessToken = tokenService.signAccessToken(user)

// After
const { token: accessToken, fingerprint } = tokenService.signAccessToken(user)
```

### Common Issues

**Issue:** TypeScript error "Property 'login' does not exist"

**Solution:** The method moved to the token store. Call `tokenStore.login()` instead of `client.login()`.

**Issue:** TypeScript error "Expected 1 arguments, but got 4" on `createJwtClient`

**Solution:** The function now takes a single options object with a `tokenStore` property. See Step 1 above.

### 🗑️ Deprecated

### `JwtLoginAction`

`JwtLoginAction` is deprecated in favor of `createJwtLoginAction(injector)` or `createPasswordLoginAction(createJwtLoginStrategy(injector))`. The static action still works but resolves services from the request-scoped injector on every call; the factory approach captures them once at setup time.

### 🧪 Tests

- Added `jwt-login-response-strategy.spec.ts` — tests token signing, refresh token persistence, fingerprint cookie behavior, and token uniqueness

### ⬆️ Dependencies

- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [1.0.0] - 2026-02-26

### ✨ Features

### JWT Bearer Token Authentication

New package providing stateless JWT-based authentication with access and refresh tokens, built on Node.js native `crypto` (HS256 with `timingSafeEqual`).

**Server-side:**

- `JwtTokenService` - Signs and verifies HS256 access tokens, manages opaque refresh tokens with rotation and grace-period support
- `JwtLoginAction` - Authenticates with username/password and returns an access + refresh token pair
- `JwtRefreshAction` - Exchanges a valid refresh token for a new token pair with configurable grace-period rotation
- `JwtLogoutAction` - Revokes a refresh token (hard revocation, no grace period)
- `useJwtAuthentication()` - Setup helper that registers the JWT Bearer provider into the `AuthenticationProvider` chain
- `createJwtAuthProvider()` - Factory for the JWT Bearer authentication provider

**Client-side (`@furystack/auth-jwt/client`):**

- `createJwtClient()` - JWT-aware REST client wrapper with automatic Bearer header injection, proactive token refresh before expiry, and refresh queuing to prevent thundering herd on concurrent requests

### 💥 Breaking Changes

- `createJwtAuthProvider({ jwtTokenService, userStore })` → `createJwtAuthProvider({ jwtTokenService, userDataSet, injector })` — now takes a `DataSet` and `Injector` instead of a `PhysicalStore`
- `JwtAuthenticationSettings.getRefreshTokenStore(StoreManager)` → `getRefreshTokenDataSet(Injector)` — returns a `DataSet` instead of a `PhysicalStore`
- `JwtTokenService` now operates through the Repository DataSet layer instead of direct `PhysicalStore` access
- `useJwtAuthentication()` now requires a DataSet for `RefreshToken` to be registered via `getRepository(injector).createDataSet()` before calling

### 🔄 Migration

**Setup:**

```typescript
// Before
useJwtAuthentication(injector, { secret: '...' })

// After — register the RefreshToken DataSet first
getRepository(injector).createDataSet(RefreshToken, 'token')
useJwtAuthentication(injector, { secret: '...' })
```

**Custom auth provider:**

```typescript
// Before
const userStore = storeManager.getStoreFor(User, 'username')
createJwtAuthProvider({ jwtTokenService, userStore })

// After
const userDataSet = getDataSetFor(injector, User, 'username')
createJwtAuthProvider({ jwtTokenService, userDataSet, injector })
```

### 📦 Dependencies

- Added `@furystack/repository` for repository layer enforcement
