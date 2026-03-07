<!-- version-type: minor -->

# @furystack/rest-service

## 🗑️ Deprecated

- `generateSwaggerJsonFromApiSchema` - Use `generateOpenApiDocument` instead
- `CreateGetSwaggerJsonAction` - Use `CreateGetOpenApiDocumentAction` instead
- `WithSchemaAndSwaggerAction` - Use `WithSchemaAndOpenApiAction` instead

## ✨ Features

### OpenAPI Document Generation with Metadata

- Added `generateOpenApiDocument()` - Replaces `generateSwaggerJsonFromApiSchema` with enhanced output. Now extracts request body, query parameter, and header parameter schemas from `Validate()` wrappers. Accepts a `metadata` parameter to emit document-level metadata (servers, tags, contact, license, externalDocs, securitySchemes) and operation-level metadata (tags, deprecated, summary, description).

- Added `CreateGetOpenApiDocumentAction` - Replaces `CreateGetSwaggerJsonAction`, serves the generated OpenAPI document at `/openapi.json`

- Added `WithSchemaAndOpenApiAction<T>` - Replaces `WithSchemaAndSwaggerAction<T>`, extending a `RestApi` with `/schema` and `/openapi.json` endpoints

### Metadata Round-Trip

Operation-level `tags`, `deprecated`, `summary`, and `description` from the `ApiEndpointDefinition` are now emitted into the generated OpenAPI document. When combined with `openApiToSchema()` from `@furystack/rest`, these fields survive the full round-trip.

## ♻️ Refactoring

- Renamed `swagger/generate-swagger-json.ts` to `openapi/generate-openapi-document.ts` with backward-compatible re-exports
- Changed the auto-registered schema endpoint from `/swagger.json` to `/openapi.json` in `ApiManager`

## 🧪 Tests

- Unit tests for `generateOpenApiDocument()` covering all HTTP methods (including HEAD, OPTIONS, TRACE, CONNECT), path/query/header parameter extraction, request body extraction, security, and operation metadata emission
- Round-trip integration tests importing OpenAPI JSON fixtures (basic example API, CRUD API, and advanced Pet Store API) and verifying structural fidelity through the `openApiToSchema() -> generateOpenApiDocument()` pipeline
- Type-level tests for `OpenApiToRestApi` with the advanced fixture covering `$ref` resolution, `allOf` composition, path parameters, request body extraction, and metadata
- Updated `validate.integration.spec.ts` to use the new `/openapi.json` endpoint
