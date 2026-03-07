<!-- version-type: minor -->

# @furystack/rest

## 🗑️ Deprecated

- `SwaggerDocument` type - Use `OpenApiDocument` instead
- `/swagger.json` endpoint in `WithSchemaAction` - Replaced by `/openapi.json`

## ✨ Features

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

## ♻️ Refactoring

- Renamed `swagger-document.ts` to `openapi-document.ts` with backward-compatible re-exports
- Changed `WithSchemaAction` to expose `/openapi.json` instead of `/swagger.json`

## 🧪 Tests

- Type-level tests for `OpenApiToRestApi`, `JsonSchemaToType`, and `ConvertOpenApiPath` covering primitives, objects, arrays, enums, const, nullable, allOf/oneOf/anyOf, `$ref` resolution, path/query/body extraction, and metadata
- Unit tests for `openApiToSchema()` covering all HTTP methods, path conversion, response schema extraction, authentication detection, and document/operation metadata
- Unit tests for `resolveOpenApiRefs()` covering schema/parameter/response/requestBody resolution, circular ref handling, external refs, and unresolvable refs
- Round-trip tests importing external JSON fixtures to verify the consume-produce pipeline

## 📚 Documentation

- Added JSDoc with OpenAPI 3.1 spec links to all 26 exported OpenAPI types
- Added JSDoc to `RestApi`, `ApiDocumentMetadata`, and all new exported functions and types
