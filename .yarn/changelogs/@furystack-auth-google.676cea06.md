<!-- version-type: major -->

# @furystack/auth-google

## 💥 Breaking Changes

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

## ✨ Features

### Strategy-based login actions

`createGoogleLoginAction(strategy)` accepts a `LoginResponseStrategy<TResult>` and returns a fully typed `RequestAction`. The result type is inferred from the strategy, enabling type-safe JWT or cookie login endpoints from Google authentication.

## 🧪 Tests

- Rewrote `google-login-action.spec.ts` to test the factory pattern with mock strategies, custom result types, and error propagation
