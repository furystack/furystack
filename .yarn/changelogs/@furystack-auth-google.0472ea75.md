<!-- version-type: major -->

# @furystack/auth-google

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

### Token verification moved from Google tokeninfo endpoint to local JWT validation

The package now uses `google-auth-library` (`OAuth2Client.verifyIdToken()`) to verify Google ID tokens locally instead of calling Google's `https://www.googleapis.com/oauth2/v3/tokeninfo` HTTP endpoint. This validates the JWT signature, audience, issuer, and expiry without a network round-trip.

### `GoogleLoginSettings` class removed — use `useGoogleAuthentication()` instead

`GoogleLoginSettings` has been removed. Its user-lookup logic and configuration have been merged into `GoogleLoginService`. Setup now requires the new `useGoogleAuthentication()` helper, which accepts a required `clientId`:

```typescript
// ❌ Before
const settings = injector.getInstance(GoogleLoginSettings)
settings.getUserFromGooglePayload = async (payload) => {
  /* ... */
}

// ✅ After
import { useGoogleAuthentication } from '@furystack/auth-google'

useGoogleAuthentication(injector, { clientId: 'YOUR_CLIENT_ID' })
```

### `GoogleApiPayload` type removed — use `TokenPayload` from `google-auth-library`

The custom `GoogleApiPayload` interface has been replaced by the `TokenPayload` type re-exported from `google-auth-library`. The `sub` field is now a `string` (was `number`).

```typescript
// ❌ Before
import type { GoogleApiPayload } from '@furystack/auth-google'

// ✅ After
import type { TokenPayload } from '@furystack/auth-google'
```

### `GoogleLoginService.login()` removed — use `getGoogleUserData()` + `getUserFromGooglePayload()`

The single `login(token)` method has been split into two steps:

- `getGoogleUserData(token)` — verifies the token and returns the decoded `TokenPayload`
- `getUserFromGooglePayload(payload)` — resolves the local user (overridable)

**Impact:** Direct callers of `GoogleLoginService.login()` must update to the two-step flow. Users of `createGoogleLoginAction()` are not affected.

### `GoogleLoginService` lifetime changed from `scoped` to `explicit`

`GoogleLoginService` must now be registered explicitly via `useGoogleAuthentication()` instead of being auto-created per scope.

## ✨ Features

### `useGoogleAuthentication()` setup helper

New entry point for configuring Google authentication. Validates the required `clientId` and registers a configured `GoogleLoginService` instance on the injector.

### Browser-side GIS helpers (`./client` sub-export)

New `@furystack/auth-google/client` entry point for browser-only code (no server-side imports):

- `loadGoogleIdentityServices()` — dynamically loads the GIS script (idempotent)
- `initializeGoogleAuth(options)` — loads GIS and calls `google.accounts.id.initialize()`, returns controls for rendering buttons and prompts
- `googleLogin(options)` — POSTs the Google ID token to a backend endpoint with `credentials: 'include'`
- Type definitions: `GoogleCredentialResponse`, `GoogleIdentityOptions`, `GsiButtonConfiguration`, `GoogleAccountsId`, `GoogleAuthControls`, `GoogleLoginOptions`

### Optional CSRF token validation

Added `enableCsrfCheck` option to `GoogleLoginService`. When enabled, the login action validates the `g_csrf_token` double-submit cookie sent by Google Identity Services before processing the login.

## 📚 Documentation

- Rewrote README with updated server setup guide, client setup examples, and token payload reference

## 🧪 Tests

- Rewrote `GoogleLoginService` tests for the new `google-auth-library`-based verification flow
- Rewrote `createGoogleLoginAction` tests for the two-step token verification and user lookup
- Added tests for CSRF validation (matching tokens, mismatched tokens, missing cookie, disabled check)
- Added tests for new client helpers (`initializeGoogleAuth`, `googleLogin`, `loadGoogleIdentityServices`)

## ⬆️ Dependencies

- Added `google-auth-library` ^10.6.1 for local Google ID token verification
