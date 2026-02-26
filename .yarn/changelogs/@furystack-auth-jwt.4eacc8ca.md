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

- `createJwtClient` no longer exposes `login`, `logout`, `getAccessToken`, `isAuthenticated`, or `setTokens` — these now live on the `JwtTokenStore`
- `createJwtClient` no longer accepts `loginEndpoint`, `refreshEndpoint`, or `logoutEndpoint` parameters — the token store's callbacks handle the actual network requests instead

## 🧪 Tests

- Added tests for `createJwtTokenStore` covering login, logout, token refresh, expiry detection, concurrent refresh queuing, and change callbacks
- Updated `createJwtClient` tests to use the new `tokenStore` option
