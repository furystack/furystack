import type { NestedRoute } from './nested-router.js'

/**
 * Concatenates parent and child route paths, handling the '/' root specially
 * to avoid double slashes.
 * @typeParam Parent - The parent route path
 * @typeParam Child - The child route path
 */
export type ConcatPaths<Parent extends string, Child extends string> = Parent extends '/' ? Child : `${Parent}${Child}`

/**
 * Recursively extracts all valid full URL paths from a nested route tree.
 * @typeParam T - A record of route patterns to NestedRoute definitions
 */
export type ExtractRoutePaths<T extends Record<string, NestedRoute<any, any, any>>> = {
  [K in keyof T & string]:
    | K
    | (T[K] extends { children: infer C extends Record<string, NestedRoute<any, any, any>> }
        ? ConcatPaths<K, ExtractRoutePaths<C> & string>
        : never)
}[keyof T & string]

/**
 * Extracts route parameter names from a URL pattern and creates a record type
 * mapping each parameter name to `string`.
 * Returns `Record<string, never>` when no parameters are present.
 * @typeParam T - A URL pattern string potentially containing `:param` segments
 */
export type ExtractRouteParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof ExtractRouteParams<`/${Rest}`>]: string }
  : T extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, never>

/**
 * A recursive type for validating URL constant objects against a set of valid paths.
 * Leaf values must be valid route paths, and intermediate values can be nested UrlTree objects.
 * @typeParam TPaths - Union of valid route path strings
 */
export type UrlTree<TPaths extends string> = {
  [key: string]: TPaths | UrlTree<TPaths>
}

/**
 * A query string validator function for a nested route. Receives the deserialized
 * query string object and returns either the typed query value or `null` when
 * the URL's query does not match the route's expected shape.
 * @typeParam TQuery - The typed query shape the route expects
 */
export type QueryValidator<TQuery> = (raw: Record<string, unknown>) => TQuery | null

/**
 * A readonly tuple of string literals describing the allowed URL hash values
 * for a nested route.
 */
export type HashLiterals = readonly string[]

/**
 * Extracts the typed query shape declared by a {@link NestedRoute}'s `query` validator.
 * Resolves to `never` when the route has no `query` validator.
 * @typeParam R - A NestedRoute value type
 */
export type ExtractRouteQuery<R> = R extends { query: QueryValidator<infer Q> } ? Q : never

/**
 * Extracts the typed hash literal union declared by a {@link NestedRoute}'s `hash` tuple.
 * Resolves to `never` when the route has no `hash` declaration.
 * @typeParam R - A NestedRoute value type
 */
export type ExtractRouteHash<R> = R extends { hash: infer H extends HashLiterals } ? H[number] : never

/**
 * Walks a nested route tree and resolves the route value at the given composed path.
 * Used to surface per-route `query` / `hash` metadata to call-site helpers.
 * @typeParam TRoutes - The route tree
 * @typeParam TPath - A full composed route path (as produced by {@link ExtractRoutePaths})
 */
export type RouteAt<TRoutes extends Record<string, NestedRoute<any, any, any>>, TPath extends string> = {
  [K in keyof TRoutes & string]: TPath extends K
    ? TRoutes[K]
    : K extends '/'
      ? TRoutes[K] extends { children: infer C extends Record<string, NestedRoute<any, any, any>> }
        ? RouteAt<C, TPath>
        : never
      : TPath extends `${K}${infer Rest}`
        ? TRoutes[K] extends { children: infer C extends Record<string, NestedRoute<any, any, any>> }
          ? RouteAt<C, Rest>
          : never
        : never
}[keyof TRoutes & string]

/**
 * Builds the `params` portion of a typed navigation / link argument.
 * Resolves to `{ params?: Record<string, string> }` when the path has no `:param`
 * segments and `{ params: {...} }` when at least one is required.
 * @typeParam TPath - A URL pattern string
 */
export type TypedParamsArg<TPath extends string> = string extends keyof ExtractRouteParams<TPath>
  ? { params?: Record<string, string> }
  : { params: ExtractRouteParams<TPath> }

/**
 * Builds the `query` portion of a typed navigation / link argument.
 * - `never` (route declared no schema) → property is forbidden.
 * - All-optional schema → property itself is optional.
 * - Any required key → property is required.
 * @typeParam TQuery - The route's typed query shape
 */
export type TypedQueryArg<TQuery> = [TQuery] extends [never]
  ? { query?: never }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- `{} extends T` is the idiomatic way to detect "all keys optional" on an arbitrary object shape.
    {} extends TQuery
    ? { query?: TQuery }
    : { query: TQuery }

/**
 * Builds the `hash` portion of a typed navigation / link argument.
 * Hash is always optional at the call site (URL fragments are never required
 * for correctness of navigation).
 * @typeParam THash - The route's hash literal union
 */
export type TypedHashArg<THash> = [THash] extends [never] ? { hash?: never } : { hash?: THash }
