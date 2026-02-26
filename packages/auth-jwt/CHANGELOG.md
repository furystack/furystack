# Changelog

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
