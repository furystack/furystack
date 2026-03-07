/**
 * Represents an OpenAPI 3.1 document.
 * @see https://spec.openapis.org/oas/v3.1.0#openapi-object
 */
export type OpenApiDocument = {
  openapi: string
  info: InfoObject
  jsonSchemaDialect?: string
  externalDocs?: ExternalDocumentationObject
  servers?: ServerObject[]
  tags?: TagObject[]
  security?: SecurityRequirementObject[]
  paths?: Record<string, PathItem>
  webhooks?: Record<string, PathItem>
  components?: ComponentsObject
  [key: `x-${string}`]: unknown
}

/** @deprecated Use OpenApiDocument instead */
export type SwaggerDocument = OpenApiDocument

/**
 * Metadata about the API.
 * @see https://spec.openapis.org/oas/v3.1.0#info-object
 */
export type InfoObject = {
  title: string
  version: string
  description?: string
  summary?: string
  termsOfService?: string
  contact?: ContactObject
  license?: LicenseObject
  [key: `x-${string}`]: unknown
}

/**
 * Contact information for the API.
 * @see https://spec.openapis.org/oas/v3.1.0#contact-object
 */
export type ContactObject = {
  name?: string
  url?: string
  email?: string
  [key: `x-${string}`]: unknown
}

/**
 * License information for the API.
 * @see https://spec.openapis.org/oas/v3.1.0#license-object
 */
export type LicenseObject = {
  name: string
  identifier?: string
  url?: string
  [key: `x-${string}`]: unknown
}

/**
 * A reference to external documentation.
 * @see https://spec.openapis.org/oas/v3.1.0#external-documentation-object
 */
export type ExternalDocumentationObject = {
  url: string
  description?: string
  [key: `x-${string}`]: unknown
}

/**
 * An object representing a server.
 * @see https://spec.openapis.org/oas/v3.1.0#server-object
 */
export type ServerObject = {
  url: string
  description?: string
  variables?: Record<string, ServerVariableObject>
  [key: `x-${string}`]: unknown
}

/**
 * An object representing a server variable for server URL template substitution.
 * @see https://spec.openapis.org/oas/v3.1.0#server-variable-object
 */
export type ServerVariableObject = {
  default: string
  description?: string
  enum?: string[]
  [key: `x-${string}`]: unknown
}

/**
 * Adds metadata to a single tag used by operations.
 * @see https://spec.openapis.org/oas/v3.1.0#tag-object
 */
export type TagObject = {
  name: string
  description?: string
  externalDocs?: ExternalDocumentationObject
  [key: `x-${string}`]: unknown
}

/**
 * Lists the required security schemes to execute an operation.
 * Each entry maps a security scheme name to a list of required scopes.
 * @see https://spec.openapis.org/oas/v3.1.0#security-requirement-object
 */
export type SecurityRequirementObject = Record<string, string[]>

/**
 * Holds a set of reusable objects for the OpenAPI document.
 * @see https://spec.openapis.org/oas/v3.1.0#components-object
 */
export type ComponentsObject = {
  schemas?: Record<string, object | boolean>
  responses?: Record<string, ResponseObject | ReferenceObject>
  parameters?: Record<string, ParameterObject | ReferenceObject>
  examples?: Record<string, ExampleObject | ReferenceObject>
  requestBodies?: Record<string, RequestBodyObject | ReferenceObject>
  headers?: Record<string, HeaderObject | ReferenceObject>
  securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>
  links?: Record<string, LinkObject | ReferenceObject>
  callbacks?: Record<string, CallbackObject | ReferenceObject>
  pathItems?: Record<string, PathItem | ReferenceObject>
  [key: `x-${string}`]: unknown
}

/**
 * A JSON Reference object pointing to another location in the document or an external resource.
 * @see https://spec.openapis.org/oas/v3.1.0#reference-object
 */
export type ReferenceObject = {
  $ref: string
  description?: string
  summary?: string
}

/**
 * Describes the operations available on a single path.
 * @see https://spec.openapis.org/oas/v3.1.0#path-item-object
 */
export type PathItem = {
  summary?: string
  description?: string
  get?: Operation
  put?: Operation
  post?: Operation
  delete?: Operation
  options?: Operation
  head?: Operation
  patch?: Operation
  trace?: Operation
  servers?: ServerObject[]
  parameters?: Array<ParameterObject | ReferenceObject>
  [key: `x-${string}`]: unknown
}

/**
 * Describes a single API operation on a path.
 * @see https://spec.openapis.org/oas/v3.1.0#operation-object
 */
export type Operation = {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: ExternalDocumentationObject
  operationId?: string
  parameters?: Array<ParameterObject | ReferenceObject>
  requestBody?: RequestBodyObject | ReferenceObject
  responses: ResponsesObject
  callbacks?: Record<string, CallbackObject | ReferenceObject>
  deprecated?: boolean
  security?: SecurityRequirementObject[]
  servers?: ServerObject[]
  [key: `x-${string}`]: unknown
}

/**
 * Describes a single operation parameter (path, query, header, or cookie).
 * @see https://spec.openapis.org/oas/v3.1.0#parameter-object
 */
export type ParameterObject = {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  style?: string
  explode?: boolean
  allowReserved?: boolean
  schema?: object | boolean
  example?: unknown
  examples?: Record<string, ExampleObject | ReferenceObject>
  content?: Record<string, MediaTypeObject>
  [key: `x-${string}`]: unknown
}

/**
 * Describes the request body of an operation.
 * @see https://spec.openapis.org/oas/v3.1.0#request-body-object
 */
export type RequestBodyObject = {
  description?: string
  content: Record<string, MediaTypeObject>
  required?: boolean
  [key: `x-${string}`]: unknown
}

/**
 * Describes the content of a request body or response for a specific media type.
 * @see https://spec.openapis.org/oas/v3.1.0#media-type-object
 */
export type MediaTypeObject = {
  schema?: object | boolean
  example?: unknown
  examples?: Record<string, ExampleObject | ReferenceObject>
  encoding?: Record<string, EncodingObject>
  [key: `x-${string}`]: unknown
}

/**
 * Describes the encoding properties for a specific property in a request body.
 * @see https://spec.openapis.org/oas/v3.1.0#encoding-object
 */
export type EncodingObject = {
  contentType?: string
  headers?: Record<string, HeaderObject | ReferenceObject>
  style?: string
  explode?: boolean
  allowReserved?: boolean
  [key: `x-${string}`]: unknown
}

/**
 * A map of HTTP status codes to response objects describing the operation responses.
 * @see https://spec.openapis.org/oas/v3.1.0#responses-object
 */
export type ResponsesObject = Record<string, ResponseObject | ReferenceObject>

/**
 * Describes a single response from an API operation.
 * @see https://spec.openapis.org/oas/v3.1.0#response-object
 */
export type ResponseObject = {
  description: string
  headers?: Record<string, HeaderObject | ReferenceObject>
  content?: Record<string, MediaTypeObject>
  links?: Record<string, LinkObject | ReferenceObject>
  [key: `x-${string}`]: unknown
}

/**
 * Describes a header parameter, equivalent to a ParameterObject without `name` and `in`.
 * @see https://spec.openapis.org/oas/v3.1.0#header-object
 */
export type HeaderObject = Omit<ParameterObject, 'name' | 'in'>

/**
 * An object holding a reusable example value.
 * @see https://spec.openapis.org/oas/v3.1.0#example-object
 */
export type ExampleObject = {
  summary?: string
  description?: string
  value?: unknown
  externalValue?: string
  [key: `x-${string}`]: unknown
}

/**
 * Represents a possible design-time link for a response.
 * @see https://spec.openapis.org/oas/v3.1.0#link-object
 */
export type LinkObject = {
  operationRef?: string
  operationId?: string
  parameters?: Record<string, unknown>
  requestBody?: unknown
  description?: string
  server?: ServerObject
  [key: `x-${string}`]: unknown
}

/**
 * A map of callback objects keyed by expression.
 * @see https://spec.openapis.org/oas/v3.1.0#callback-object
 */
export type CallbackObject = Record<string, PathItem>

/**
 * Defines a security scheme for the API (apiKey, http, oauth2, openIdConnect, or mutualTLS).
 * @see https://spec.openapis.org/oas/v3.1.0#security-scheme-object
 */
export type SecuritySchemeObject = {
  type: 'apiKey' | 'http' | 'mutualTLS' | 'oauth2' | 'openIdConnect'
  description?: string
  name?: string
  in?: 'query' | 'header' | 'cookie'
  scheme?: string
  bearerFormat?: string
  flows?: OAuthFlowsObject
  openIdConnectUrl?: string
  [key: `x-${string}`]: unknown
}

/**
 * Allows configuration of the supported OAuth flows.
 * @see https://spec.openapis.org/oas/v3.1.0#oauth-flows-object
 */
export type OAuthFlowsObject = {
  implicit?: OAuthFlowObject
  password?: OAuthFlowObject
  clientCredentials?: OAuthFlowObject
  authorizationCode?: OAuthFlowObject
  [key: `x-${string}`]: unknown
}

/**
 * Configuration details for a specific OAuth flow type.
 * @see https://spec.openapis.org/oas/v3.1.0#oauth-flow-object
 */
export type OAuthFlowObject = {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
  [key: `x-${string}`]: unknown
}
