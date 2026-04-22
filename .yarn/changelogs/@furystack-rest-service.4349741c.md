<!-- version-type: major -->

# @furystack/rest-service

## 💥 Breaking Changes

### Removed the legacy `LoginAction`

The static `LoginAction` has been removed. It was deprecated in favor of the factory-based `createPasswordLoginAction(createCookieLoginStrategy(injector))`, which captures the auth services once at setup time instead of resolving them from the request-scoped injector on every call.

**Impact:** `import { LoginAction } from '@furystack/rest-service'` will fail.

**Migration:**

```ts
import { createPasswordLoginAction, createCookieLoginStrategy } from '@furystack/rest-service'

// old:
// '/login': LoginAction,
// new:
'/login': createPasswordLoginAction(createCookieLoginStrategy(injector)),
```

### Removed Swagger-named aliases and the `/swagger.json` auto-registration

The following deprecated Swagger-era aliases and the automatic `/swagger.json` backward-compat endpoint have been removed from `ApiManager`:

- `generateSwaggerJsonFromApiSchema` (alias of `generateOpenApiDocument`)
- `CreateGetSwaggerJsonAction` (alias of `CreateGetOpenApiDocumentAction`)
- `CreateDeprecatedSwaggerRedirect`
- `WithSchemaAndSwaggerAction<T>` (alias of `WithSchemaAndOpenApiAction<T>`)
- The auto-registered `GET /swagger.json` endpoint that `useRestService({ enableGetSchema: true })` previously exposed alongside `/openapi.json`

**Impact:** Imports of the aliases will fail. Any client still calling `/swagger.json` against a FuryStack server will get a 404; the `Deprecation` / `Link` headers that previously pointed to `/openapi.json` are gone.

**Migration:**

- Rename type / function imports to their OpenAPI-prefixed counterparts (`generateOpenApiDocument`, `CreateGetOpenApiDocumentAction`, `WithSchemaAndOpenApiAction`).
- Point clients at `/openapi.json` directly.
