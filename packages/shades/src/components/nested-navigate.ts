import type { Injector } from '@furystack/inject'
import { serializeToQueryString } from '@furystack/rest'
import { compileRoute } from '../compile-route.js'
import { LocationService } from '../services/location-service.js'
import type {
  ExtractRouteHash,
  ExtractRouteQuery,
  ExtractRoutePaths,
  RouteAt,
  TypedHashArg,
  TypedParamsArg,
  TypedQueryArg,
} from './nested-route-types.js'
import type { NestedRoute } from './nested-router.js'

/**
 * Untyped runtime arguments for a nested navigate call.
 * Used by the base {@link nestedNavigate} implementation; the typed variants
 * returned by {@link createNestedNavigate} narrow each field against the route
 * tree at compile time.
 */
export type NestedNavigateArgs = {
  path: string
  params?: Record<string, string>
  query?: Record<string, unknown>
  hash?: string
}

/**
 * Typed arguments for a nested navigate call, derived from the route tree and
 * the specific target path.
 *
 * - `params` is required when the path contains `:param` segments.
 * - `query` is required when the route's declared query shape has any required
 *   key, optional when all keys are optional, and forbidden when the route
 *   declares no `query` validator.
 * - `hash` is always optional and restricted to the route's declared literal
 *   tuple; forbidden when the route declares no `hash`.
 *
 * @typeParam TRoutes - The route tree
 * @typeParam TPath - A composed route path within `TRoutes`
 */
export type TypedNestedNavigateArgs<
  TRoutes extends Record<string, NestedRoute<any, any, any>>,
  TPath extends string,
> = { path: TPath } & TypedParamsArg<TPath> &
  TypedQueryArg<ExtractRouteQuery<RouteAt<TRoutes, TPath>>> &
  TypedHashArg<ExtractRouteHash<RouteAt<TRoutes, TPath>>>

/**
 * Builds the resolved URL for a nested navigate call, including path parameters,
 * serialized query string and hash segment. Exported for callers that need the
 * URL without side effects (e.g. link rendering helpers).
 */
export const buildNestedNavigateUrl = (args: NestedNavigateArgs): string => {
  const { path, params, query, hash } = args
  const resolvedPath = params && Object.keys(params).length > 0 ? compileRoute(path, params) : path
  const hasQuery = query && Object.keys(query).length > 0
  const search = hasQuery ? `?${serializeToQueryString(query)}` : ''
  const hashPart = hash ? `#${hash}` : ''
  return `${resolvedPath}${search}${hashPart}`
}

/**
 * Navigates to a route using the LocationService resolved from the given injector.
 * Compiles parameterized routes (e.g. `/users/:id`), serializes the optional
 * `query` record with the default `@furystack/rest` serializer, and appends the
 * optional `hash` segment.
 *
 * @param injector - The injector instance to resolve LocationService from
 * @param args - The navigation arguments
 */
export const nestedNavigate = (injector: Injector, args: NestedNavigateArgs): void => {
  injector.get(LocationService).navigate(buildNestedNavigateUrl(args))
}

/**
 * Creates a type-safe navigate function constrained to a specific route tree.
 * The returned function has the same runtime behavior as {@link nestedNavigate}
 * but narrows `path` to only accept valid route paths, requires `params` when
 * the route has parameters, and enforces the route's declared `query` and
 * `hash` schemas.
 *
 * Unlike {@link createNestedRouteLink}, the injector is passed at call time,
 * not at creation time.
 *
 * @typeParam TRoutes - The route tree type (use `typeof yourRoutes`)
 * @returns A type-safe navigate function
 *
 * @example
 * ```typescript
 * const appNavigate = createNestedNavigate<typeof appRoutes>()
 *
 * appNavigate(injector, { path: '/buttons' })
 * appNavigate(injector, { path: '/users/:id', params: { id: '123' } })
 * appNavigate(injector, {
 *   path: '/users/:id',
 *   params: { id: '123' },
 *   query: { tab: 'profile' },
 *   hash: 'settings',
 * })
 * ```
 */
export const createNestedNavigate = <TRoutes extends Record<string, NestedRoute<any, any, any>>>() => {
  return nestedNavigate as <TPath extends ExtractRoutePaths<TRoutes>>(
    injector: Injector,
    args: TypedNestedNavigateArgs<TRoutes, TPath>,
  ) => void
}
