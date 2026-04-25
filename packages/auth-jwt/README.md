# @furystack/auth-jwt

JWT Bearer token authentication for FuryStack with built-in token fingerprinting for XSS protection.

## Installation

```bash
npm install @furystack/auth-jwt
# or
yarn add @furystack/auth-jwt
```

## Server Setup

```typescript
import { createInjector } from '@furystack/inject'
import { useHttpAuthentication, useRestService } from '@furystack/rest-service'
import { usePasswordPolicy } from '@furystack/security'
import {
  useJwtAuthentication,
  createJwtLoginAction,
  JwtRefreshAction,
  JwtLogoutAction,
  RefreshTokenStore,
} from '@furystack/auth-jwt'
// Your app-level persistent store factory for refresh tokens
import { refreshTokenStoreFactory } from './my-app/stores.js'

const injector = createInjector()

// RefreshTokenStore is throw-by-default — bind a persistent implementation
injector.bind(RefreshTokenStore, refreshTokenStoreFactory)

// Set up authentication
useHttpAuthentication(injector)
usePasswordPolicy(injector)
useJwtAuthentication(injector, {
  secret: 'your-secret-at-least-32-bytes-long!',
  accessTokenExpirationSeconds: 900, // 15 minutes
  refreshTokenExpirationSeconds: 604800, // 7 days
})

// Wire up the REST endpoints
await useRestService({
  injector,
  port: 8080,
  root: 'api',
  api: {
    POST: {
      '/jwt/login': createJwtLoginAction(injector),
      '/jwt/refresh': JwtRefreshAction,
      '/jwt/logout': JwtLogoutAction,
    },
  },
})
```

## Login Response Strategy

The JWT login strategy can be used with any authentication mechanism, not just password-based login. Use `createJwtLoginStrategy(injector)` to create a strategy, then pass it to any login action factory:

```typescript
import { createJwtLoginStrategy } from '@furystack/auth-jwt'
import { createPasswordLoginAction } from '@furystack/rest-service'
import { createGoogleLoginAction } from '@furystack/auth-google'

const jwtStrategy = createJwtLoginStrategy(injector)

// Password login with JWT tokens
const passwordLogin = createPasswordLoginAction(jwtStrategy)

// Google login with JWT tokens
const googleLogin = createGoogleLoginAction(jwtStrategy)
```

The return type is inferred from the strategy — both actions above return `ActionResult<{ accessToken: string; refreshToken: string }>`.

## Client Setup

The client entry point is available at `@furystack/auth-jwt/client`:

```typescript
import { createJwtTokenStore, createJwtClient } from '@furystack/auth-jwt/client'

// Create a shared token store
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

// Create a typed REST client that auto-injects Bearer headers
const client = createJwtClient<MyApi>({
  endpointUrl: 'https://api.example.com',
  tokenStore,
})

// Login
await tokenStore.login({ username: 'admin', password: 'secret' })

// Make authenticated calls (Bearer header injected automatically)
const result = await client.call({ method: 'GET', action: '/currentUser' })
```

## Token Fingerprinting (XSS Protection)

By default, access tokens are protected against XSS token theft using the [OWASP Token Sidejacking](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-sidejacking) pattern:

1. At login/refresh, the server generates a random fingerprint
2. The SHA-256 hash of the fingerprint is embedded as an `fpt` claim in the JWT
3. The raw fingerprint value is sent as an HTTP-only, Secure, SameSite=Strict cookie
4. On each request, the server hashes the cookie value and compares it to the JWT claim

An XSS attacker who steals the JWT from JavaScript-accessible storage cannot authenticate without the HTTP-only cookie (inaccessible to scripts).

### Configuration

Fingerprinting is **enabled by default**. The settings can be customized or disabled:

```typescript
useJwtAuthentication(injector, {
  secret: 'your-secret-at-least-32-bytes-long!',
  fingerprintCookie: {
    enabled: true, // default: true (set to false to disable)
    name: 'fpt', // cookie name (consider '__Secure-fpt' in production)
    sameSite: 'Strict', // 'Strict' | 'Lax' | 'None'
    secure: true, // Secure flag (HTTPS only)
    path: '/', // cookie path
  },
})
```

### Client-Side

`createJwtClient` automatically sets `credentials: 'include'` on fetch requests so the browser sends the HTTP-only cookie. This can be overridden:

```typescript
const client = createJwtClient<MyApi>({
  endpointUrl: 'https://api.example.com',
  tokenStore,
  requestInit: {
    credentials: 'same-origin', // override if needed
  },
})
```

### Disabling Fingerprinting

For non-browser clients (CLI tools, server-to-server), disable fingerprinting:

```typescript
useJwtAuthentication(injector, {
  secret: 'your-secret-at-least-32-bytes-long!',
  fingerprintCookie: {
    enabled: false,
    name: 'fpt',
    sameSite: 'Strict',
    secure: true,
    path: '/',
  },
})
```

## Configuration Options

| Option                                   | Default      | Description                                        |
| ---------------------------------------- | ------------ | -------------------------------------------------- |
| `secret`                                 | _(required)_ | HMAC secret for HS256 signing (minimum 32 bytes)   |
| `accessTokenExpirationSeconds`           | `900`        | Access token lifetime (15 minutes)                 |
| `refreshTokenExpirationSeconds`          | `604800`     | Refresh token lifetime (7 days)                    |
| `clockSkewToleranceSeconds`              | `5`          | Tolerance for clock drift in token expiry checks   |
| `refreshTokenRotationGracePeriodSeconds` | `30`         | Grace period for replaying a rotated refresh token |
| `issuer`                                 | `undefined`  | JWT `iss` claim (signed and verified if set)       |
| `audience`                               | `undefined`  | JWT `aud` claim (signed and verified if set)       |
| `fingerprintCookie.enabled`              | `true`       | Enable fingerprint cookie protection               |
| `fingerprintCookie.name`                 | `'fpt'`      | Cookie name                                        |
| `fingerprintCookie.sameSite`             | `'Strict'`   | SameSite attribute                                 |
| `fingerprintCookie.secure`               | `true`       | Secure flag                                        |
| `fingerprintCookie.path`                 | `'/'`        | Cookie path                                        |

## Security Features

- **HS256 with timing-safe verification** using Node.js native `crypto`
- **Token fingerprinting** (OWASP sidejacking prevention) via HTTP-only cookies
- **Refresh token rotation** with configurable grace period for network race conditions
- **Minimum secret length** enforcement (32 bytes / 256 bits)
- **Algorithm validation** (only HS256 accepted, rejects `none` and other algorithms)
- **User existence check** on every authenticated request (not just at token creation)
