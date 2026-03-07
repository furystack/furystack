import type { Injector } from '@furystack/inject'
import type { ApiDocumentMetadata, OpenApiDocument, RestApi, SecuritySchemeObject } from '@furystack/rest'

import type { RestApiImplementation } from '../api-manager.js'
import { getSchemaFromApi } from '../get-schema-from-api.js'
import { HttpAuthenticationSettings } from '../http-authentication-settings.js'
import { mapProvidersToSecuritySchemes } from '../openapi/auth-provider-to-security-scheme.js'
import { generateOpenApiDocument } from '../openapi/generate-openapi-document.js'
import { JsonResult, type RequestAction } from '../request-action-implementation.js'

const getSecuritySchemesFromInjector = (injector: Injector): Record<string, SecuritySchemeObject> | undefined => {
  try {
    const settings = injector.getInstance(HttpAuthenticationSettings)
    if (settings.authenticationProviders.length > 0) {
      return mapProvidersToSecuritySchemes(settings.authenticationProviders)
    }
  } catch {
    /* auth not configured */
  }
  return undefined
}

const buildOpenApiDoc = (
  endpoints: ReturnType<typeof getSchemaFromApi>['endpoints'],
  name: string,
  description: string,
  version: string,
  metadata?: ApiDocumentMetadata,
): OpenApiDocument => generateOpenApiDocument({ api: endpoints, title: name, description, version, metadata })

/**
 * Generates a RequestAction that retrieves the OpenAPI document from a FuryStack API implementation.
 * When authentication providers are configured (via `useHttpAuthentication` / `useJwtAuthentication`),
 * the generated document will include matching OpenAPI security schemes automatically.
 *
 * @param api - The API implementation from which to extract the schema.
 * @returns A RequestAction that handles the GET request for the OpenAPI document.
 */
export const CreateGetOpenApiDocumentAction = <T extends RestApiImplementation<RestApi>>(
  api: T,
  name = 'FuryStack API',
  description = 'API documentation generated from FuryStack API schema',
  version = '1.0.0',
): RequestAction<{ result: OpenApiDocument }> => {
  const { endpoints } = getSchemaFromApi({ api, name, description, version })
  let cachedDoc: OpenApiDocument | undefined
  return async ({ injector }) => {
    if (!cachedDoc) {
      const securitySchemes = getSecuritySchemesFromInjector(injector)
      cachedDoc = buildOpenApiDoc(
        endpoints,
        name,
        description,
        version,
        securitySchemes ? { securitySchemes } : undefined,
      )
    }
    return JsonResult(cachedDoc, 200)
  }
}

/**
 * Generates a backward-compatible `/swagger.json` endpoint that serves the same OpenAPI document
 * as `CreateGetOpenApiDocumentAction` but includes `Deprecation` and `Link` headers
 * directing clients to use `/openapi.json` instead.
 *
 * @deprecated Use CreateGetOpenApiDocumentAction and `/openapi.json` instead.
 */
export const CreateDeprecatedSwaggerRedirect = <T extends RestApiImplementation<RestApi>>(
  api: T,
  name = 'FuryStack API',
  description = 'API documentation generated from FuryStack API schema',
  version = '1.0.0',
): RequestAction<{ result: OpenApiDocument }> => {
  const { endpoints } = getSchemaFromApi({ api, name, description, version })
  let cachedDoc: OpenApiDocument | undefined
  return async ({ injector }) => {
    if (!cachedDoc) {
      const securitySchemes = getSecuritySchemesFromInjector(injector)
      cachedDoc = buildOpenApiDoc(
        endpoints,
        name,
        description,
        version,
        securitySchemes ? { securitySchemes } : undefined,
      )
    }
    return JsonResult(cachedDoc, 200, {
      Deprecation: 'true',
      Link: '</openapi.json>; rel="successor-version"',
    })
  }
}

/** @deprecated Use CreateGetOpenApiDocumentAction instead */
export const CreateGetSwaggerJsonAction = CreateGetOpenApiDocumentAction
