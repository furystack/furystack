<!-- version-type: minor -->

# @furystack/auth-jwt

## 🗑️ Deprecated

### `JwtLoginAction`

`JwtLoginAction` is deprecated in favor of `createJwtLoginAction(injector)` or `createPasswordLoginAction(createJwtLoginStrategy(injector))`. The static action still works but resolves services from the request-scoped injector on every call; the factory approach captures them once at setup time.

## ✨ Features

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

## 🧪 Tests

- Added `jwt-login-response-strategy.spec.ts` — tests token signing, refresh token persistence, fingerprint cookie behavior, and token uniqueness
