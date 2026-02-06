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
export type ExtractRoutePaths<T extends Record<string, NestedRoute<unknown>>> = {
  [K in keyof T & string]:
    | K
    | (T[K] extends { children: infer C extends Record<string, NestedRoute<unknown>> }
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
