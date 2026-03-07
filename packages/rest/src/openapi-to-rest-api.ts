import type { OpenApiDocument } from './openapi-document.js'
import type { RestApi } from './rest-api.js'

/**
 * Converts an OpenAPI `{param}` path to FuryStack `:param` format at the type level.
 *
 * @example
 * ```typescript
 * type Result = ConvertOpenApiPath<'/users/{userId}/posts/{postId}'>
 * // Result = '/users/:userId/posts/:postId'
 * ```
 */
export type ConvertOpenApiPath<P extends string> = P extends `${infer Before}{${infer Param}}${infer After}`
  ? `${Before}:${Param}${ConvertOpenApiPath<After>}`
  : P

/**
 * Maps a JSON Schema type keyword to its TypeScript equivalent.
 * Handles primitives, arrays, objects with properties, and falls back to `unknown`.
 */
export type JsonSchemaToType<S> = S extends { type: 'string'; enum: ReadonlyArray<infer E> }
  ? E
  : S extends { type: 'string' }
    ? string
    : S extends { type: 'number' | 'integer' }
      ? number
      : S extends { type: 'boolean' }
        ? boolean
        : S extends { type: 'null' }
          ? null
          : S extends { type: 'array'; items: infer Items }
            ? Array<JsonSchemaToType<Items>>
            : S extends { type: 'object'; properties: infer Props extends Record<string, unknown> }
              ? S extends { required: ReadonlyArray<infer R extends string> }
                ? { [K in keyof Props & R]: JsonSchemaToType<Props[K]> } & {
                    [K in Exclude<keyof Props, R>]?: JsonSchemaToType<Props[K]>
                  }
                : { [K in keyof Props]?: JsonSchemaToType<Props[K]> }
              : S extends { type: 'object' }
                ? Record<string, unknown>
                : unknown

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

type ExtractResponseSchema<Op> = Op extends { responses: infer R }
  ? R extends { '200': infer Resp200 }
    ? Resp200 extends { content: { 'application/json': { schema: infer S } } }
      ? JsonSchemaToType<S>
      : unknown
    : R extends { '201': infer Resp201 }
      ? Resp201 extends { content: { 'application/json': { schema: infer S } } }
        ? JsonSchemaToType<S>
        : unknown
      : unknown
  : unknown

type ExtractRequestBodySchema<Op> = Op extends {
  requestBody: { content: { 'application/json': { schema: infer S } } }
}
  ? JsonSchemaToType<S>
  : never

type ExtractPathParamsFromPath<P extends string> = P extends `${string}{${infer Param}}${infer Rest}`
  ? { [K in Param | keyof ExtractPathParamsFromPath<Rest>]: string }
  : never

type HasPathParams<P extends string> = P extends `${string}{${string}}${string}` ? true : false

type ExtractQueryParamEntries<P> = P extends { in: 'query'; name: infer N extends string; schema: infer S }
  ? { [K in N]: JsonSchemaToType<S> }
  : P extends { in: 'query'; name: infer N extends string }
    ? { [K in N]: string }
    : never

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never

type BuildQueryParams<Op> = Op extends { parameters: ReadonlyArray<infer Param> }
  ? [ExtractQueryParamEntries<Param>] extends [never]
    ? never
    : UnionToIntersection<ExtractQueryParamEntries<Param>>
  : never

type BuildEndpoint<T extends OpenApiDocument, P extends string, M extends LowercaseHttpMethod> = {
  result: ExtractResponseSchema<GetOperation<T, P, M>>
} & ([ExtractRequestBodySchema<GetOperation<T, P, M>>] extends [never]
  ? unknown
  : { body: ExtractRequestBodySchema<GetOperation<T, P, M>> }) &
  (HasPathParams<P> extends true ? { url: ExtractPathParamsFromPath<P> } : unknown) &
  ([BuildQueryParams<GetOperation<T, P, M>>] extends [never]
    ? unknown
    : { query: BuildQueryParams<GetOperation<T, P, M>> })

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
 * Use with `as const satisfies OpenApiDocument` to get full type inference:
 *
 * @example
 * ```typescript
 * import type { OpenApiDocument, OpenApiToRestApi } from '@furystack/rest'
 * import { createClient } from '@furystack/rest-client-fetch'
 *
 * const apiDoc = {
 *   openapi: '3.1.0',
 *   info: { title: 'My API', version: '1.0.0' },
 *   paths: {
 *     '/users': {
 *       get: {
 *         responses: {
 *           '200': {
 *             description: 'User list',
 *             content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } },
 *           },
 *         },
 *       },
 *     },
 *   },
 * } as const satisfies OpenApiDocument
 *
 * type MyApi = OpenApiToRestApi<typeof apiDoc>
 * // MyApi = { GET: { '/users': { result: string[] } } }
 *
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
