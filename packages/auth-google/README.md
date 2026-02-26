# @furystack/auth-google

Google OAuth authentication for FuryStack.

This package verifies Google ID tokens on the server using the
[google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)
(local JWT signature check, audience/issuer/expiry validation) and provides a
browser-side helper for Google Identity Services (GIS).

## Installation

```bash
npm install @furystack/auth-google
# or
yarn add @furystack/auth-google
```

## Server setup

### 1. Configure Google authentication

Call `useGoogleAuthentication` **after** `useHttpAuthentication`:

```ts
import { Injector } from '@furystack/inject'
import { useHttpAuthentication } from '@furystack/rest-service'
import { useGoogleAuthentication } from '@furystack/auth-google'

const injector = new Injector()

useHttpAuthentication(injector, {
  /* … */
})

useGoogleAuthentication(injector, {
  clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
})
```

`clientId` is required. It must match the client ID used on the frontend.

### 2. Create a login endpoint

Use `createGoogleLoginAction(strategy)` to create a login action. The
strategy determines what the response looks like — cookie sessions, JWT
tokens, or anything custom.

#### With cookie sessions

```ts
import { createGoogleLoginAction } from '@furystack/auth-google'
import { createCookieLoginStrategy, useRestService } from '@furystack/rest-service'

const cookieStrategy = createCookieLoginStrategy(injector)
const googleLogin = createGoogleLoginAction(cookieStrategy)
// googleLogin: RequestAction<{ result: User; body: { token: string } }>

await useRestService({
  injector,
  api: myApi,
  actions: {
    '/login/google': googleLogin,
  },
})
```

#### With JWT tokens

```ts
import { createGoogleLoginAction } from '@furystack/auth-google'
import { createJwtLoginStrategy } from '@furystack/auth-jwt'

const jwtStrategy = createJwtLoginStrategy(injector)
const googleLogin = createGoogleLoginAction(jwtStrategy)
// googleLogin: RequestAction<{ result: { accessToken: string; refreshToken: string }; body: { token: string } }>
```

The return type is fully inferred from the strategy.

### 3. Customise user lookup (optional)

Override `getUserFromGooglePayload` to change how Google accounts map to
local users:

```ts
useGoogleAuthentication(injector, {
  clientId: 'YOUR_CLIENT_ID',
  getUserFromGooglePayload: async (payload) => {
    // payload.email, payload.email_verified, payload.name, …
    return myUserStore.findByEmail(payload.email!)
  },
})
```

The default implementation requires `email_verified` to be `true` and
looks up the user by `email` in the configured User DataSet.

### 4. CSRF protection (optional)

When using Google Identity Services on the frontend, you can enable
the `g_csrf_token` double-submit cookie check:

```ts
useGoogleAuthentication(injector, {
  clientId: 'YOUR_CLIENT_ID',
  enableCsrfCheck: true,
})
```

When enabled, the login action compares `g_csrf_token` from the cookie
header against the value in the request body before processing the login.

## Client setup

The package also provides a `./client` sub-export for browser use. It
does **not** import any server-side code and is safe for bundlers.

```ts
import { initializeGoogleAuth, googleLogin } from '@furystack/auth-google/client'
```

### Load and initialise Google Identity Services

```ts
import { initializeGoogleAuth, googleLogin } from '@furystack/auth-google/client'

const auth = await initializeGoogleAuth({
  client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  callback: async (response) => {
    // response.credential contains the Google ID token
    const user = await googleLogin({
      endpointUrl: '/api/login/google',
      credential: response.credential,
    })
    console.log('Logged in as', user)
  },
})

// Render the "Sign in with Google" button
auth.renderButton(document.getElementById('google-btn')!, {
  type: 'standard',
  size: 'large',
  theme: 'outline',
})

// Or show the One Tap prompt
auth.prompt()
```

### Client API

| Export                         | Description                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| `loadGoogleIdentityServices()` | Dynamically loads the GIS script. Idempotent.                          |
| `initializeGoogleAuth(opts)`   | Loads GIS + calls `google.accounts.id.initialize()`. Returns controls. |
| `googleLogin(opts)`            | POSTs the credential to your backend endpoint.                         |
| `GoogleCredentialResponse`     | Type for the GIS credential callback response.                         |
| `GoogleIdentityOptions`        | Type for GIS initialisation options.                                   |
| `GsiButtonConfiguration`       | Type for the "Sign in with Google" button config.                      |
| `GoogleAuthControls`           | Type returned by `initializeGoogleAuth`.                               |

## Token payload

The server re-exports `TokenPayload` from `google-auth-library` for
convenience:

```ts
import type { TokenPayload } from '@furystack/auth-google'
```

Key fields: `sub` (unique Google ID, string), `email`, `email_verified`,
`name`, `picture`, `given_name`, `family_name`, `locale`, `aud`, `iss`,
`exp`.
