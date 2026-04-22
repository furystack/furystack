# Changelog

## [9.0.0] - 2026-04-22

### 💥 Breaking Changes

### Removed the legacy `SwaggerDocument` type and `swagger-document.ts` entry

The deprecated `SwaggerDocument` type alias and its backward-compat re-export module `swagger-document.ts` have been removed. `OpenApiDocument` (and the other OpenAPI 3.1 types exported from `openapi-document.ts`) is the canonical model and has been the recommended name for several releases.

**Impact:** Imports like `import type { SwaggerDocument } from '@furystack/rest'` or `import { ... } from '@furystack/rest/swagger-document.js'` will fail.

**Migration:** Replace `SwaggerDocument` with `OpenApiDocument`. Drop any `swagger-document.js` sub-path imports — everything it re-exported lives on the package root / `openapi-document.js`.

### Removed the `/swagger.json` endpoint from `WithSchemaAction`

The deprecated `/swagger.json` GET endpoint on `WithSchemaAction<T>` has been removed. Consumers should target `/openapi.json` exclusively.

**Impact:** `WithSchemaAction<T>['GET']['/swagger.json']` is no longer part of the type. Any `createClient<WithSchemaAction<...>>()` call site calling `/swagger.json` will fail type checking.

**Migration:** Rename `/swagger.json` call sites to `/openapi.json`. The request/response shape is identical.

## [8.1.5] - 2026-04-17

### ⬆️ Dependencies

- Raised `@types/node` to ^25.6.0, `typescript` to ^6.0.3, and `vitest` to ^4.1.4 so package development matches the workspace toolchain.

## [8.1.4] - 2026-03-27

### ⬆️ Dependencies

- Updated `vitest` to ^4.1.2

## [8.1.3] - 2026-03-25

### 📦 Build

- Removed deprecated `baseUrl` from tsconfig.json for TypeScript 6 compatibility

### ⬆️ Dependencies

- Upgraded `typescript` from ^5.9.3 to ^6.0.2
- Upgraded `vitest` from ^4.1.0 to ^4.1.1

## [8.1.2] - 2026-03-19

### ✨ Features

- Added bidirectional OpenAPI 3.1 support (`OpenApiToRestApi`, `openApiToSchema()`, converters, metadata).
- Improved error handling: `decode()` throws `RequestError` on invalid query values and percent-encoding.
- `decode()` now throws `RequestError` for malformed base64/JSON/percent‑encoding inputs.

### ⬆️ Dependencies

- Upgraded `vite` from ^7.3.1 to ^8.0.0 for improved build performance and new features
- Upgraded `vitest` from ^4.0.18 to ^4.1.0
- Upgraded `@vitest/coverage-istanbul` from ^4.0.18 to ^4.1.0

## [8.1.1] - 2026-03-10

### ⬆️ Dependencies

- Updated `@furystack/core` dependency to the new major version

## [8.1.0] - 2026-03-07

### ⬆️ Dependencies

- Updated `@types/node` from `^25.3.1` to `^25.3.5`

### 🗑️ Deprecated

- `SwaggerDocument` type - Use `OpenApiDocument` instead
- `/swagger.json` endpoint in `WithSchemaAction` - Use `/openapi.json` instead. The `/swagger.json` endpoint remains available during the transition period and responds with `Deprecation` and `Link` headers pointing to `/openapi.json`.

### ✨ Features

### Bidirectional OpenAPI 3.1 Support

The package can now both **consume** and **produce** OpenAPI 3.1 documents with strong typing.

### Consume: OpenAPI to FuryStack

Import an OpenAPI JSON document and derive a strongly-typed `RestApi` from it:

```typescript
import type { OpenApiDocument, OpenApiToRestApi } from '@furystack/rest'
import { createClient } from '@furystack/rest-client-fetch'

const apiDoc = {
  /* downloaded OpenAPI JSON */
} as const satisfies OpenApiDocument
type MyApi = OpenApiToRestApi<typeof apiDoc>

const client = createClient<MyApi>({ endpointUrl: 'https://api.example.com' })
```

- Added `OpenApiToRestApi<T>` - Extracts a strongly-typed `RestApi` from an `as const` OpenAPI document, including path parameters, query parameters, request bodies, and response types
- Added `JsonSchemaToType<S>` - Maps JSON Schema types to TypeScript types, supporting primitives, arrays, objects with required/optional properties, `enum`, `const`, `nullable` (`type: ['string', 'null']`), and composition (`allOf`, `oneOf`, `anyOf`)
- Added `ConvertOpenApiPath<P>` - Converts OpenAPI `{param}` path format to FuryStack `:param` format at the type level
- Added `resolveOpenApiRefs()` - Resolves all internal `$ref` pointers in an OpenAPI document, inlining the referenced schemas, parameters, responses, and request bodies. Handles circular references safely.
- Added `openApiToSchema()` - Converts an OpenAPI document to a FuryStack `ApiEndpointSchema` at runtime, preserving metadata (tags, deprecated, summary, description, servers, security schemes, contact, license)
- Added `convertOpenApiPathToFuryStack()` - Runtime path format conversion from OpenAPI `{param}` to FuryStack `:param`

### Type-level `$ref` Resolution

`OpenApiToRestApi` resolves `$ref` pointers within the type system, so schemas that use `$ref` to `components/schemas`, `components/parameters`, `components/responses`, and `components/requestBodies` are resolved automatically.

### OpenAPI Document Types

- Renamed `SwaggerDocument` to `OpenApiDocument` with all associated types (`InfoObject`, `PathItem`, `Operation`, `ParameterObject`, `ResponseObject`, etc.) - these model the full OpenAPI 3.1 specification

### Metadata Support

- Extended `RestApi` endpoint shape with optional metadata: `tags`, `deprecated`, `summary`, `description`
- Added `ApiDocumentMetadata` type for document-level metadata (servers, tags, contact, license, externalDocs, securitySchemes)
- Added metadata fields to `ApiEndpointDefinition` and `ApiEndpointSchema`

### ♻️ Refactoring

- Replaced `swagger-document.ts` with `openapi-document.ts` (the old file now re-exports from the new one for backward compatibility)
- Changed `WithSchemaAction` to expose `/openapi.json` instead of `/swagger.json`

### 🧪 Tests

- Type-level tests for `OpenApiToRestApi`, `JsonSchemaToType`, and `ConvertOpenApiPath` covering primitives, objects, arrays, enums, const, nullable, allOf/oneOf/anyOf, `$ref` resolution, path/query/body extraction, and metadata
- Unit tests for `openApiToSchema()` covering all HTTP methods, path conversion, response schema extraction, authentication detection, and document/operation metadata
- Unit tests for `resolveOpenApiRefs()` covering schema/parameter/response/requestBody resolution, circular ref handling, external refs, and unresolvable refs
- Round-trip tests importing external JSON fixtures to verify the consume-produce pipeline

### 📚 Documentation

- Added JSDoc with OpenAPI 3.1 spec links to all 26 exported OpenAPI types
- Added JSDoc to `RestApi`, `ApiDocumentMetadata`, and all new exported functions and types

## [8.0.42] - 2026-03-06

### ⬆️ Dependencies

- Updated internal FuryStack dependencies

## [8.0.41] - 2026-03-03

### ⬆️ Dependencies

- Updated `@furystack/utils` with EventHub listener error handling

### 🐛 Bug Fixes

- `decode()` now throws a `RequestError` with status 400 when query parameter values contain invalid base64, invalid percent-encoding, or invalid JSON, instead of letting raw errors propagate

### 🧪 Tests

- Added unit tests for `decode()` error handling covering invalid base64, invalid percent-encoding, and invalid JSON inputs
- Added test for `deserializeQueryString()` rejecting malformed query parameter values

## [8.0.40] - 2026-02-26

### ⬆️ Dependencies

- Updated internal `@furystack/*` dependencies
- Bumped `@types/node` from ^25.3.0 to ^25.3.1

## [8.0.39] - 2026-02-26

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [8.0.38] - 2026-02-22

### ⬆️ Dependencies

- Updated `@furystack/core` dependency

## [8.0.37] - 2026-02-19

### ⬆️ Dependencies

- Updated `@furystack/core`

## [8.0.36] - 2026-02-11

### ⬆️ Dependencies

- Bump `vitest` from `^4.0.17` to `^4.0.18`
- Bump `@types/node` from `^25.0.10` to `^25.2.3`
- Updated internal dependencies

## [8.0.35] - 2026-02-09

### ⬆️ Dependencies

- Updated `@furystack/core` dependency
- Updated `@furystack/*` dependencies

## [8.0.34] - 2026-01-26

### 🔧 Chores

- Standardized author format, improved keywords, removed obsolete `gitHead`, added `engines` (Node 22+) and `sideEffects: false`

## [8.0.33] - 2026-01-26

### ⬆️ Dependencies

- Updated `@furystack/inject` with fix for singleton injector reference being overwritten by child injectors

## [8.0.32] - 2026-01-22

### ⬆️ Dependencies

- Dependency updates

### 📚 Documentation

- Expanded README with detailed API definition examples and type documentation

### 🔧 Chores

- Migrated to centralized changelog management system
