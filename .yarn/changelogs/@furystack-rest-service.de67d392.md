<!-- version-type: major -->

# @furystack/rest-service

## ✨ Features

### Pluggable Authentication Provider System

Introduced the `AuthenticationProvider` type and refactored `HttpUserContext.authenticateRequest()` to iterate an ordered provider chain instead of hardcoded Basic Auth and Cookie Auth logic.

- `AuthenticationProvider` - Type for pluggable authentication providers. Each provider returns `User` on success, `null` if it doesn't apply, or throws on auth failure.
- `createBasicAuthProvider()` - Factory that extracts the existing Basic Auth logic into a standalone provider
- `createCookieAuthProvider()` - Factory that extracts the existing Cookie Auth logic into a standalone provider
- `HttpAuthenticationSettings.authenticationProviders` - Ordered list of providers, populated by `useHttpAuthentication()` and extensible by auth plugins like `useJwtAuthentication()`

**Usage:**

```typescript
useHttpAuthentication(injector, {
  enableBasicAuth: true,
  authenticationProviders: [myCustomProvider],
})
```

Custom providers are appended after the built-in Basic Auth and Cookie Auth providers.

## ♻️ Refactoring

- `useHttpAuthentication()` now eagerly resolves `PasswordAuthenticator` and store dependencies at setup time, constructing providers with resolved instances rather than passing the `Injector`
- `Authenticate()` middleware checks for a registered `'basic-auth'` provider by name instead of reading the `enableBasicAuth` flag when deciding whether to include the `WWW-Authenticate: Basic` response header
- Extracted shared store lookup helpers (`authenticateUserWithDataSet`, `findSessionById`, `findUserByName`, `extractSessionIdFromCookies`) into `authentication-providers/helpers.ts`

## 💥 Breaking Changes

- `HttpAuthenticationSettings.getUserStore(StoreManager)` → `getUserDataSet(Injector)` — now returns a `DataSet` instead of a `PhysicalStore`
- `HttpAuthenticationSettings.getSessionStore(StoreManager)` → `getSessionDataSet(Injector)`
- `HttpUserContext.getUserStore()` → `getUserDataSet()`
- `HttpUserContext.getSessionStore()` → `getSessionDataSet()`
- `authenticateUserWithStore()` → `authenticateUserWithDataSet()` — renamed helper with updated signature
- `useHttpAuthentication()` now requires DataSets for `User` and `DefaultSession` to be registered via `getRepository(injector).createDataSet()` before calling
