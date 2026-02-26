<!-- version-type: minor -->

# @furystack/rest-service

## ✨ Features

### `LoginResponseStrategy<TResult>` type

New pluggable type that decouples login actions from session/token creation. A strategy turns an authenticated `User` into an `ActionResult<TResult>` — the generic parameter flows through to the action's return type for full type inference.

```typescript
import type { LoginResponseStrategy } from '@furystack/rest-service'

type LoginResponseStrategy<TResult> = {
  createLoginResponse: (user: User, injector: Injector) => Promise<ActionResult<TResult>>
}
```

### `createCookieLoginStrategy(injector)`

Factory that creates a cookie-based `LoginResponseStrategy<User>`. On login it generates a random session ID, persists it in the session DataSet, and returns the user with a `Set-Cookie` header.

```typescript
import { createCookieLoginStrategy } from '@furystack/rest-service'

const cookieStrategy = createCookieLoginStrategy(injector)
// cookieStrategy.createLoginResponse(user, injector) → ActionResult<User> with Set-Cookie header
```

### `createPasswordLoginAction(strategy)`

Factory that creates a password-based login `RequestAction`. Authenticates via `HttpUserContext.authenticateUser()` then delegates session/token creation to the provided strategy. Includes timing-attack mitigation on failure.

```typescript
import { createPasswordLoginAction, createCookieLoginStrategy } from '@furystack/rest-service'

const cookieStrategy = createCookieLoginStrategy(injector)
const loginAction = createPasswordLoginAction(cookieStrategy)
// loginAction: RequestAction<{ result: User; body: { username: string; password: string } }>
```

## 🧪 Tests

- Added `login-response-strategy.spec.ts` — tests cookie strategy session creation, Set-Cookie headers, session persistence, and session ID uniqueness
- Added `password-login-action.spec.ts` — tests strategy delegation, user forwarding, auth failure handling, and custom strategy result types
