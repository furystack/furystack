import type { OpenApiDocument } from './openapi-document.js'
import type { RestApi } from './rest-api.js'

/**
 * Converts an OpenAPI `{param}` path to FuryStack `:param` format at the type level.
 */
export type ConvertOpenApiPath<P extends string> = P extends `${infer Before}{${infer Param}}${infer After}`
  ? `${Before}:${Param}${ConvertOpenApiPath<After>}`
  : P

// ─── $ref resolution ───────────────────────────────────────────────────────────

type ResolveRef<Doc extends OpenApiDocument, Ref extends string> = Ref extends `#/components/schemas/${infer Name}`
  ? Doc['components'] extends { schemas: infer S }
    ? Name extends keyof S
      ? S[Name]
      : unknown
    : unknown
  : Ref extends `#/components/parameters/${infer Name}`
    ? Doc['components'] extends { parameters: infer S }
      ? Name extends keyof S
        ? S[Name]
        : unknown
      : unknown
    : Ref extends `#/components/responses/${infer Name}`
      ? Doc['components'] extends { responses: infer S }
        ? Name extends keyof S
          ? S[Name]
          : unknown
        : unknown
      : Ref extends `#/components/requestBodies/${infer Name}`
        ? Doc['components'] extends { requestBodies: infer S }
          ? Name extends keyof S
            ? S[Name]
            : unknown
          : unknown
        : unknown

type ResolveSchemaOrRef<Doc extends OpenApiDocument, S> = S extends { $ref: infer Ref extends string }
  ? ResolveRef<Doc, Ref>
  : S

// ─── JSON Schema → TypeScript type mapping ─────────────────────────────────────

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never

/**
 * Maps a JSON Schema type keyword to its TypeScript equivalent.
 * Supports primitives, arrays, objects, enum, const, oneOf/anyOf/allOf, nullable, and $ref.
 *
 * The `Doc` parameter is threaded through for `$ref` resolution within schemas.
 */
export type JsonSchemaToType<S, Doc extends OpenApiDocument = OpenApiDocument> =
  // $ref
  S extends { $ref: infer Ref extends string }
    ? JsonSchemaToType<ResolveRef<Doc, Ref>, Doc>
    : // const literal
      S extends { const: infer C }
      ? C
      : // string enum
        S extends { type: 'string'; enum: ReadonlyArray<infer E> }
        ? E
        : // string
          S extends { type: 'string' }
          ? string
          : // number / integer
            S extends { type: 'number' | 'integer' }
            ? number
            : // boolean
              S extends { type: 'boolean' }
              ? boolean
              : // null
                S extends { type: 'null' }
                ? null
                : // nullable (3.1 style: type is a tuple with 'null')
                  S extends { type: readonly [infer T, 'null'] }
                  ? JsonSchemaToType<{ type: T }, Doc> | null
                  : S extends { type: readonly ['null', infer T] }
                    ? JsonSchemaToType<{ type: T }, Doc> | null
                    : // array
                      S extends { type: 'array'; items: infer Items }
                      ? Array<JsonSchemaToType<Items, Doc>>
                      : // object with properties + required
                        S extends { type: 'object'; properties: infer Props extends Record<string, unknown> }
                        ? S extends { required: ReadonlyArray<infer R extends string> }
                          ? { [K in keyof Props & R]: JsonSchemaToType<Props[K], Doc> } & {
                              [K in Exclude<keyof Props, R>]?: JsonSchemaToType<Props[K], Doc>
                            }
                          : { [K in keyof Props]?: JsonSchemaToType<Props[K], Doc> }
                        : // object without properties
                          S extends { type: 'object' }
                          ? Record<string, unknown>
                          : // allOf → intersection
                            S extends { allOf: ReadonlyArray<infer Items> }
                            ? UnionToIntersection<JsonSchemaToType<Items, Doc>>
                            : // oneOf → union
                              S extends { oneOf: ReadonlyArray<infer Items> }
                              ? JsonSchemaToType<Items, Doc>
                              : // anyOf → union
                                S extends { anyOf: ReadonlyArray<infer Items> }
                                ? JsonSchemaToType<Items, Doc>
                                : unknown

// ─── HTTP method utilities ──────────────────────────────────────────────────────

type LowercaseHttpMethod = 'get' | 'put' | 'post' | 'delete' | 'patch' | 'head' | 'options' | 'trace'

type MethodMap = {
  get: 'GET'
  put: 'PUT'
  post: 'POST'
  delete: 'DELETE'
  patch: 'PATCH'
  head: 'HEAD'
  options: 'OPTIONS'
  trace: 'TRACE'
}

type UppercaseMethod<M extends string> = M extends keyof MethodMap ? MethodMap[M] : never

// ─── Path / operation extraction ────────────────────────────────────────────────

type PathsWithMethod<T extends OpenApiDocument, M extends LowercaseHttpMethod> = {
  [P in keyof NonNullable<T['paths']> & string]: NonNullable<T['paths']>[P] extends infer PathItem
    ? M extends keyof PathItem
      ? PathItem[M] extends object
        ? P
        : never
      : never
    : never
}[keyof NonNullable<T['paths']> & string]

type GetOperation<T extends OpenApiDocument, P extends string, M extends LowercaseHttpMethod> = NonNullable<
  T['paths']
>[P] extends infer PathItem
  ? M extends keyof PathItem
    ? PathItem[M]
    : never
  : never

// ─── Response / body / parameter extraction ─────────────────────────────────────

type ExtractResponseSchema<Doc extends OpenApiDocument, Op> = Op extends { responses: infer R }
  ? R extends { '200': infer Resp200 }
    ? ResolveSchemaOrRef<Doc, Resp200> extends { content: { 'application/json': { schema: infer S } } }
      ? JsonSchemaToType<S, Doc>
      : unknown
    : R extends { '201': infer Resp201 }
      ? ResolveSchemaOrRef<Doc, Resp201> extends { content: { 'application/json': { schema: infer S } } }
        ? JsonSchemaToType<S, Doc>
        : unknown
      : unknown
  : unknown

type ExtractRequestBodySchema<Doc extends OpenApiDocument, Op> = Op extends {
  requestBody: infer RB
}
  ? ResolveSchemaOrRef<Doc, RB> extends { content: { 'application/json': { schema: infer S } } }
    ? JsonSchemaToType<S, Doc>
    : never
  : never

type ExtractPathParamsFromPath<P extends string> = P extends `${string}{${infer Param}}${infer Rest}`
  ? { [K in Param | keyof ExtractPathParamsFromPath<Rest>]: string }
  : never

type HasPathParams<P extends string> = P extends `${string}{${string}}${string}` ? true : false

type ResolvedParam<Doc extends OpenApiDocument, P> = P extends { $ref: infer Ref extends string }
  ? ResolveRef<Doc, Ref>
  : P

type ExtractQueryParamEntry<Doc extends OpenApiDocument, P> =
  ResolvedParam<Doc, P> extends { in: 'query'; name: infer N extends string; schema: infer S }
    ? { [K in N]: JsonSchemaToType<S, Doc> }
    : ResolvedParam<Doc, P> extends { in: 'query'; name: infer N extends string }
      ? { [K in N]: string }
      : never

type BuildQueryParamsFromTuple<Doc extends OpenApiDocument, T> = T extends readonly [infer Head, ...infer Tail]
  ? [ExtractQueryParamEntry<Doc, Head>] extends [never]
    ? BuildQueryParamsFromTuple<Doc, Tail>
    : ExtractQueryParamEntry<Doc, Head> & BuildQueryParamsFromTuple<Doc, Tail>
  : unknown

type HasQueryParams<Doc extends OpenApiDocument, T> = T extends readonly [infer Head, ...infer Tail]
  ? [ExtractQueryParamEntry<Doc, Head>] extends [never]
    ? HasQueryParams<Doc, Tail>
    : true
  : false

type BuildQueryParams<Doc extends OpenApiDocument, Op> = Op extends {
  parameters: infer Params extends readonly unknown[]
}
  ? HasQueryParams<Doc, Params> extends true
    ? BuildQueryParamsFromTuple<Doc, Params>
    : never
  : never

// ─── Metadata extraction ────────────────────────────────────────────────────────

type ExtractTags<Op> = Op extends { tags: infer T } ? T : never
type ExtractDeprecated<Op> = Op extends { deprecated: true } ? true : never
type ExtractSummary<Op> = Op extends { summary: infer S extends string } ? S : never
type ExtractDescription<Op> = Op extends { description: infer S extends string } ? S : never

// ─── Endpoint builder ───────────────────────────────────────────────────────────

type BuildEndpoint<T extends OpenApiDocument, P extends string, M extends LowercaseHttpMethod> = {
  result: ExtractResponseSchema<T, GetOperation<T, P, M>>
} & ([ExtractRequestBodySchema<T, GetOperation<T, P, M>>] extends [never]
  ? unknown
  : { body: ExtractRequestBodySchema<T, GetOperation<T, P, M>> }) &
  (HasPathParams<P> extends true ? { url: ExtractPathParamsFromPath<P> } : unknown) &
  ([BuildQueryParams<T, GetOperation<T, P, M>>] extends [never]
    ? unknown
    : { query: BuildQueryParams<T, GetOperation<T, P, M>> }) &
  ([ExtractTags<GetOperation<T, P, M>>] extends [never] ? unknown : { tags: ExtractTags<GetOperation<T, P, M>> }) &
  ([ExtractDeprecated<GetOperation<T, P, M>>] extends [never] ? unknown : { deprecated: true }) &
  ([ExtractSummary<GetOperation<T, P, M>>] extends [never]
    ? unknown
    : { summary: ExtractSummary<GetOperation<T, P, M>> }) &
  ([ExtractDescription<GetOperation<T, P, M>>] extends [never]
    ? unknown
    : { description: ExtractDescription<GetOperation<T, P, M>> })

type EndpointsForMethod<T extends OpenApiDocument, M extends LowercaseHttpMethod> =
  string extends PathsWithMethod<T, M>
    ? never
    : [PathsWithMethod<T, M>] extends [never]
      ? never
      : {
          [P in PathsWithMethod<T, M> as ConvertOpenApiPath<P>]: BuildEndpoint<T, P, M>
        }

type CleanObject<T> = { [K in keyof T as [T[K]] extends [never] ? never : K]: T[K] }

/**
 * Extracts a strongly-typed `RestApi` from an OpenAPI document type.
 *
 * Supports `$ref` resolution, `allOf`/`oneOf`/`anyOf` composition, `nullable`, `const`,
 * and metadata extraction (`tags`, `deprecated`, `summary`, `description`).
 *
 * Use with `as const satisfies OpenApiDocument` to get full type inference:
 *
 * @example
 * ```typescript
 * import type { OpenApiDocument, OpenApiToRestApi } from '@furystack/rest'
 * import { createClient } from '@furystack/rest-client-fetch'
 *
 * const apiDoc = { ... } as const satisfies OpenApiDocument
 * type MyApi = OpenApiToRestApi<typeof apiDoc>
 * const client = createClient<MyApi>({ endpointUrl: 'https://api.example.com' })
 * ```
 */
export type OpenApiToRestApi<T extends OpenApiDocument> =
  CleanObject<{
    [M in LowercaseHttpMethod as [EndpointsForMethod<T, M>] extends [never]
      ? never
      : UppercaseMethod<M>]: EndpointsForMethod<T, M>
  }> extends infer R extends RestApi
    ? R
    : never
