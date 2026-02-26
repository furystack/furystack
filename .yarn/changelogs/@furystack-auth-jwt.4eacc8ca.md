<!-- version-type: major -->

# @furystack/auth-jwt

<!--
FORMATTING GUIDE:

### Detailed Entry (appears first when merging)

Use h3 (###) and below for detailed entries with paragraphs, code examples, and lists.

### Simple List Items

- Simple changes can be added as list items
- They are collected together at the bottom of each section

TIP: When multiple changelog drafts are merged, heading-based entries
appear before simple list items within each section.
-->

## 💥 Breaking Changes

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

## ✨ Features

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

## 🔧 Changed

- `verifyAccessToken()` now accepts an optional second parameter `fingerprint?: string | null` for fingerprint validation
- `createJwtAuthProvider()` accepts an optional `fingerprintCookieName` parameter to enable cookie extraction for fingerprint verification
- `createJwtClient` 401 retry now uses `forceRefresh()` to handle server-side revocation of non-expired tokens

## Migration Guide

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
