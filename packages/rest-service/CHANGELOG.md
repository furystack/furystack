# Changelog

## [12.3.3] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility
- Removed `DOM.Iterable` from `lib` in tsconfig.json (merged into `DOM` in TypeScript 6)

### 🧪 Tests

- Added missing `.js` extensions to bare module imports in test files for TypeScript 6 strict module resolution

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1
- Upgraded `ws` from ^8.19.0 to ^8.20.0

## [12.3.2] - 2026-03-19

### ✨ Features

- OpenAPI document generation with metadata (`generateOpenApiDocument`, `CreateGetOpenApiDocumentAction`, `WithSchemaAndOpenApiAction`).
- Added server lifecycle events (`onServerListening`, `onServerClosed`) and HTTP auth events (`onLogin`, `onLogout`, `onSessionInvalidated`).
- `ApiManager` now responds with 400 for malformed percent‑encoded path parameters instead of crashing.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [12.3.1] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [12.3.0] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`

### 🗑️ Deprecated

- `generateSwaggerJsonFromApiSchema` - Use `generateOpenApiDocument` instead
- `CreateGetSwaggerJsonAction` - Use `CreateGetOpenApiDocumentAction` instead
- `WithSchemaAndSwaggerAction` - Use `WithSchemaAndOpenApiAction` instead

### ✨ Features

### OpenAPI Document Generation with Metadata

- Added `generateOpenApiDocument()` - Replaces `generateSwaggerJsonFromApiSchema` with enhanced output. Now extracts request body, query parameter, and header parameter schemas from `Validate()` wrappers. Accepts a `metadata` parameter to emit document-level metadata (servers, tags, contact, license, externalDocs, securitySchemes) and operation-level metadata (tags, deprecated, summary, description).

- Added `CreateGetOpenApiDocumentAction` - Replaces `CreateGetSwaggerJsonAction`, serves the generated OpenAPI document at `/openapi.json`

- Added `WithSchemaAndOpenApiAction<T>` - Replaces `WithSchemaAndSwaggerAction<T>`, extending a `RestApi` with `/schema` and `/openapi.json` endpoints

### Metadata Round-Trip

Operation-level `tags`, `deprecated`, `summary`, and `description` from the `ApiEndpointDefinition` are now emitted into the generated OpenAPI document. When combined with `openApiToSchema()` from `@furystack/rest`, these fields survive the full round-trip.

### ♻️ Refactoring

- Renamed `swagger/generate-swagger-json.ts` to `openapi/generate-openapi-document.ts` with backward-compatible re-exports
- Changed the auto-registered schema endpoint from `/swagger.json` to `/openapi.json` in `ApiManager`

### 🧪 Tests

- Unit tests for `generateOpenApiDocument()` covering all HTTP methods (including HEAD, OPTIONS, TRACE, CONNECT), path/query/header parameter extraction, request body extraction, security, and operation metadata emission
- Round-trip integration tests importing OpenAPI JSON fixtures (basic example API, CRUD API, and advanced Pet Store API) and verifying structural fidelity through the `openApiToSchema() -> generateOpenApiDocument()` pipeline
- Type-level tests for `OpenApiToRestApi` with the advanced fixture covering `$ref` resolution, `allOf` composition, path parameters, request body extraction, and metadata
- Updated `validate.integration.spec.ts` to use the new `/openapi.json` endpoint

## [12.2.1] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [12.2.0] - 2026-03-03

### ✨ Features

### Server lifecycle events in `ServerManager`

`ServerManager` now emits `onServerListening` and `onServerClosed` events, allowing consumers to observe when HTTP servers start and stop:

```typescript
serverManager.addListener('onServerListening', ({ url, port, hostName }) => {
  console.log(`Server listening at ${url}`)
})

serverManager.addListener('onServerClosed', ({ url }) => {
  console.log(`Server at ${url} closed`)
})
```

### Authentication events in `HttpUserContext`

`HttpUserContext` now extends `EventHub` and emits `onLogin`, `onLogout`, and `onSessionInvalidated` events for authentication lifecycle observability.

### `onListenerError` support

`ServerManager`, `ProxyManager`, and `HttpUserContext` event maps now include `onListenerError` for consistent listener error handling.

### 🐛 Bug Fixes

- `ApiManager` now catches `URIError` from malformed percent-encoded URL path parameters and responds with a 400 error instead of crashing

### 🧪 Tests

- Added integration tests for 400 responses on malformed query parameter values and malformed percent-encoded path parameters

## [12.1.1] - 2026-02-27

### 🐛 Bug Fixes

- Fixed `HttpAuthenticationSettings` not respecting its `TUser` and `TSession` generic type parameters when resolving data sets. `getUserDataSet` now uses the configurable `model` property instead of the hardcoded `User` class, and `getSessionDataSet` now uses the new `sessionModel` property instead of the hardcoded `DefaultSession` class. This allows custom user and session types to work correctly with `useHttpAuthentication`.

## [12.1.0] - 2026-02-26

### 🔧 Chores

- Normalized line endings in `http-user-context.ts`, `http-authentication-settings.ts`, and related spec files

### ✨ Features

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

### 🧪 Tests

- Added `login-response-strategy.spec.ts` — tests cookie strategy session creation, Set-Cookie headers, session persistence, and session ID uniqueness
- Added `password-login-action.spec.ts` — tests strategy delegation, user forwarding, auth failure handling, and custom strategy result types

### ⬆️ Dependencies

- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [12.0.0] - 2026-02-26

### ✨ Features

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

### ♻️ Refactoring

- `useHttpAuthentication()` now eagerly resolves `PasswordAuthenticator` and store dependencies at setup time, constructing providers with resolved instances rather than passing the `Injector`
- `Authenticate()` middleware checks for a registered `'basic-auth'` provider by name instead of reading the `enableBasicAuth` flag when deciding whether to include the `WWW-Authenticate: Basic` response header
- Extracted shared store lookup helpers (`authenticateUserWithDataSet`, `findSessionById`, `findUserByName`, `extractSessionIdFromCookies`) into `authentication-providers/helpers.ts`

### 💥 Breaking Changes

- `HttpAuthenticationSettings.getUserStore(StoreManager)` → `getUserDataSet(Injector)` — now returns a `DataSet` instead of a `PhysicalStore`
- `HttpAuthenticationSettings.getSessionStore(StoreManager)` → `getSessionDataSet(Injector)`
- `HttpUserContext.getUserStore()` → `getUserDataSet()`
- `HttpUserContext.getSessionStore()` → `getSessionDataSet()`
- `authenticateUserWithStore()` → `authenticateUserWithDataSet()` — renamed helper with updated signature
- `useHttpAuthentication()` now requires DataSets for `User` and `DefaultSession` to be registered via `getRepository(injector).createDataSet()` before calling

### 🔄 Migration

**Setup:**

```typescript
// Before
useHttpAuthentication(injector, {
  getUserStore: (sm) => sm.getStoreFor(User, 'username'),
  getSessionStore: (sm) => sm.getStoreFor(DefaultSession, 'sessionId'),
})

// After — register DataSets first, defaults resolve them automatically
getRepository(injector).createDataSet(User, 'username')
getRepository(injector).createDataSet(DefaultSession, 'sessionId')
useHttpAuthentication(injector)
```

**Custom store accessors:**

```typescript
// Before
settings.getUserStore(storeManager)
settings.getSessionStore(storeManager)

// After
settings.getUserDataSet(injector)
settings.getSessionDataSet(injector)
```

## [11.0.7] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [11.0.6] - 2026-02-20

### ♻️ Refactoring

- Removed `any` type assertion in `createGetCollectionEndpoint`, relying on proper type inference from `DataSet.find()` instead

## [11.0.5] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core` and `@furystack/repository`

## [11.0.4] - 2026-02-11

### 🐛 Bug Fixes

- Preserve original error cause in `PathProcessor.validateUrl()` using `{ cause: error }` for better error traceability

### ♻️ Refactoring

- Replaced semaphore-based server creation lock with a `pendingCreates` Map for deduplicating concurrent `getOrCreate()` calls. In-flight server creation promises are now reused instead of serialized behind a semaphore.
- Simplified `[Symbol.asyncDispose]()` — disposal now awaits pending server creations directly instead of waiting on a semaphore lock with a timeout.

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Removed `semaphore-async-await` dependency
- Updated internal dependencies

## [11.0.3] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [11.0.2] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [11.0.1] - 2026-01-26

### 🐛 Bug Fixes

- Added `owner` parameter when creating child injectors for API request handling, improving debuggability and traceability of injector hierarchies

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [11.0.0] - 2026-01-22

### 💥 Breaking Changes

### ApiEndpointSchema structure changed

The `ApiEndpointSchema` generic type now requires endpoints to be grouped by HTTP method.

**Before:**

```json
{
    "name": "My Endpoint",
    "description": "My Endpoint Description",
    "version": "5.2.1",
    "endpoints": {
        "/entity": {...}
    }
}
```

**After:**

```json
{
    "name": "My Endpoint",
    "description": "My Endpoint Description",
    "version": "5.2.1",
    "endpoints": {
        "GET": {
            "/entity": {...}
        },
        "POST": {
            "/entity": {...}
        }
    }
}
```

### ⬆️ Dependencies

- Dependency updates

### 🔧 Chores

- Migrated to centralized changelog management system
