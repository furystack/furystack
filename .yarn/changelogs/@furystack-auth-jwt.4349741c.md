<!-- version-type: major -->

# @furystack/auth-jwt

## 💥 Breaking Changes

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

## ♻️ Refactoring

- Removed a double-cast (`as Parameters<typeof innerClient>[0]`) when forwarding options from `createJwtClient().call()` into the inner `createClient` call. The spread result is now assigned to a typed local variable first, so the typed REST client signature is preserved without an assertion. This keeps `@furystack/auth-jwt` compliant with the new `furystack/rest-no-type-cast` rule shipped in `@furystack/eslint-plugin`.
