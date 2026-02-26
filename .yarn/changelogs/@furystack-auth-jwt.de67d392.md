<!-- version-type: minor -->

# @furystack/auth-jwt

## ✨ Features

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
