# @furystack/auth-google

Google OAuth authentication for FuryStack.

This package provides a service to authenticate users with Google ID tokens in your FuryStack backend.

## Installation

```bash
npm install @furystack/auth-google
# or
yarn add @furystack/auth-google
```

## Usage

### Backend Setup

Set up Google authentication on your FuryStack backend:

```ts
import { Injector } from '@furystack/inject'
import { GoogleLoginService, GoogleLoginSettings } from '@furystack/auth-google'
import { useHttpAuthentication, useRestService } from '@furystack/rest-service'
import type { MyApi } from 'my-common-package'

const injector = new Injector()

// Configure HTTP authentication first
useHttpAuthentication(injector, {
  // ... your authentication settings
})

// Optionally customize how Google users are mapped to your users
const googleSettings = injector.getInstance(GoogleLoginSettings)
googleSettings.getUserFromGooglePayload = async (payload) => {
  // payload contains: email, name, picture, given_name, family_name, locale
  const users = await userStore.find({
    filter: { username: { $eq: payload.email } },
  })
  return users[0]
}
```

### Creating a Login Endpoint

Use `createGoogleLoginAction(strategy)` to create a login endpoint. The strategy determines what the response looks like — cookie sessions, JWT tokens, or anything custom.

#### With cookie sessions

```ts
import { createGoogleLoginAction } from '@furystack/auth-google'
import { createCookieLoginStrategy } from '@furystack/rest-service'

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

await useRestService({
  injector,
  api: myApi,
  actions: {
    '/login/google': googleLogin,
  },
})
```

The return type is fully inferred from the strategy — no manual type annotations needed.

### Getting Google User Data

You can also retrieve Google user data without logging in:

```ts
const googleService = injector.getInstance(GoogleLoginService)
const googleData = await googleService.getGoogleUserData(idToken)

// googleData contains:
// - email: string
// - email_verified: boolean
// - name: string
// - picture: string (URL)
// - given_name: string
// - family_name: string
// - locale: string
```

### Frontend Integration

On the frontend, use the Google Sign-In API to obtain an ID token:

```ts
// Using Google Sign-In API
const auth2 = gapi.auth2.getAuthInstance()
const googleUser = await auth2.signIn()
const idToken = googleUser.getAuthResponse().id_token

// Send to your backend
const response = await fetch('/api/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: idToken }),
})
```

## Google API Payload

The `GoogleApiPayload` interface represents the data returned from Google:

```ts
interface GoogleApiPayload {
  iss: string // Issuer
  sub: number // Unique Google identifier
  email: string // Email address
  email_verified: boolean
  name: string // Full name
  picture: string // Profile picture URL
  given_name: string // First name
  family_name: string // Last name
  locale: string // User's locale
}
```
