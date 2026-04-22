<!-- version-type: major -->

# @furystack/rest

## 💥 Breaking Changes

### Removed the legacy `SwaggerDocument` type and `swagger-document.ts` entry

The deprecated `SwaggerDocument` type alias and its backward-compat re-export module `swagger-document.ts` have been removed. `OpenApiDocument` (and the other OpenAPI 3.1 types exported from `openapi-document.ts`) is the canonical model and has been the recommended name for several releases.

**Impact:** Imports like `import type { SwaggerDocument } from '@furystack/rest'` or `import { ... } from '@furystack/rest/swagger-document.js'` will fail.

**Migration:** Replace `SwaggerDocument` with `OpenApiDocument`. Drop any `swagger-document.js` sub-path imports — everything it re-exported lives on the package root / `openapi-document.js`.

### Removed the `/swagger.json` endpoint from `WithSchemaAction`

The deprecated `/swagger.json` GET endpoint on `WithSchemaAction<T>` has been removed. Consumers should target `/openapi.json` exclusively.

**Impact:** `WithSchemaAction<T>['GET']['/swagger.json']` is no longer part of the type. Any `createClient<WithSchemaAction<...>>()` call site calling `/swagger.json` will fail type checking.

**Migration:** Rename `/swagger.json` call sites to `/openapi.json`. The request/response shape is identical.
