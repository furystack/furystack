<!-- version-type: minor -->

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

## ♻️ Refactoring

- `JwtTokenService.signAccessToken()` now returns `{ token: string; fingerprint: string | null }` instead of `string` — callers must destructure the result
- `JwtTokenService.verifyAccessToken()` now accepts an optional second parameter `fingerprint?: string | null` for fingerprint validation
- `createJwtAuthProvider()` accepts an optional `fingerprintCookieName` parameter to enable cookie extraction for fingerprint verification
- `createJwtClient` no longer exposes `login`, `logout`, `getAccessToken`, `isAuthenticated`, or `setTokens` — these now live on the `JwtTokenStore`
- `createJwtClient` no longer accepts `loginEndpoint`, `refreshEndpoint`, or `logoutEndpoint` parameters — the token store's callbacks handle the actual network requests instead

## 🧪 Tests

- Added `fingerprint-cookie.spec.ts` with 13 tests covering Set-Cookie building, cookie clearing, and cookie parsing
- Added fingerprint-specific tests to `jwt-token-service.spec.ts` (fpt claim embedding, verification with correct/wrong/missing fingerprints, disabled mode)
- Added fingerprint-specific tests to `jwt-auth-provider.spec.ts` (cookie extraction, missing cookie rejection, wrong cookie rejection)
- Added fingerprint integration tests to `jwt-auth.integration.spec.ts` (full login/refresh/logout flow with cookie handling, rejection without cookie, rejection with wrong cookie)
- Added `hashFingerprint` tests to `jwt-utils.spec.ts`
- Added `credentials: 'include'` default and override tests to `jwt-client.spec.ts`
- Added tests for `createJwtTokenStore` covering login, logout, token refresh, expiry detection, concurrent refresh queuing, and change callbacks
- Updated `createJwtClient` tests to use the new `tokenStore` option
