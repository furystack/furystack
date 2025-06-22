export type SwaggerDocument = {
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

export type ContactObject = {
  name?: string
  url?: string
  email?: string
  [key: `x-${string}`]: unknown
}

export type LicenseObject = {
  name: string
  identifier?: string
  url?: string
  [key: `x-${string}`]: unknown
}

export type ExternalDocumentationObject = {
  url: string
  description?: string
  [key: `x-${string}`]: unknown
}

export type ServerObject = {
  url: string
  description?: string
  variables?: Record<string, ServerVariableObject>
  [key: `x-${string}`]: unknown
}

export type ServerVariableObject = {
  default: string
  description?: string
  enum?: string[]
  [key: `x-${string}`]: unknown
}

export type TagObject = {
  name: string
  description?: string
  externalDocs?: ExternalDocumentationObject
  [key: `x-${string}`]: unknown
}

export type SecurityRequirementObject = Record<string, string[]>

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

export type ReferenceObject = {
  $ref: string
  description?: string
  summary?: string
}

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

export type RequestBodyObject = {
  description?: string
  content: Record<string, MediaTypeObject>
  required?: boolean
  [key: `x-${string}`]: unknown
}

export type MediaTypeObject = {
  schema?: object | boolean
  example?: unknown
  examples?: Record<string, ExampleObject | ReferenceObject>
  encoding?: Record<string, EncodingObject>
  [key: `x-${string}`]: unknown
}

export type EncodingObject = {
  contentType?: string
  headers?: Record<string, HeaderObject | ReferenceObject>
  style?: string
  explode?: boolean
  allowReserved?: boolean
  [key: `x-${string}`]: unknown
}

export type ResponsesObject = Record<string, ResponseObject | ReferenceObject>

export type ResponseObject = {
  description: string
  headers?: Record<string, HeaderObject | ReferenceObject>
  content?: Record<string, MediaTypeObject>
  links?: Record<string, LinkObject | ReferenceObject>
  [key: `x-${string}`]: unknown
}

export type HeaderObject = Omit<ParameterObject, 'name' | 'in'>

export type ExampleObject = {
  summary?: string
  description?: string
  value?: unknown
  externalValue?: string
  [key: `x-${string}`]: unknown
}

export type LinkObject = {
  operationRef?: string
  operationId?: string
  parameters?: Record<string, unknown>
  requestBody?: unknown
  description?: string
  server?: ServerObject
  [key: `x-${string}`]: unknown
}

export type CallbackObject = Record<string, PathItem>

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

export type OAuthFlowsObject = {
  implicit?: OAuthFlowObject
  password?: OAuthFlowObject
  clientCredentials?: OAuthFlowObject
  authorizationCode?: OAuthFlowObject
  [key: `x-${string}`]: unknown
}

export type OAuthFlowObject = {
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  scopes: Record<string, string>
  [key: `x-${string}`]: unknown
}
