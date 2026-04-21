import type { Injector } from '@furystack/inject'
import { LocationService } from '../services/location-service.js'
import type { ExtractRouteHash, ExtractRouteQuery, ExtractRoutePaths, RouteAt } from './nested-route-types.js'
import type { NestedRoute } from './nested-router.js'

/**
 * A pair of synchronous read helpers bound to a specific route tree. Use the
 * factory {@link createNestedHooks} to produce one.
 */
export type NestedHooks<TRoutes extends Record<string, NestedRoute<any, any, any>>> = {
  /**
   * Reads and validates the current URL query string against the declared
   * validator of the route at `path`. Returns the typed query value, or
   * `null` when the route has no validator or the current URL's query does
   * not satisfy it.
   *
   * This is a synchronous snapshot — for reactive use, subscribe to
   * `locationService.onDeserializedLocationSearchChanged` and call this read
   * on each change.
   */
  getTypedQuery: <TPath extends ExtractRoutePaths<TRoutes>>(
    injector: Injector,
    path: TPath,
  ) => ExtractRouteQuery<RouteAt<TRoutes, TPath>> | null
  /**
   * Reads the current URL hash and narrows it against the declared literal
   * tuple of the route at `path`. Returns the hash when it matches one of
   * the route's declared literals, or `undefined` otherwise.
   *
   * This is a synchronous snapshot — for reactive use, subscribe to
   * `locationService.onLocationHashChanged` and call this read on each change.
   */
  getTypedHash: <TPath extends ExtractRoutePaths<TRoutes>>(
    injector: Injector,
    path: TPath,
  ) => ExtractRouteHash<RouteAt<TRoutes, TPath>> | undefined
}

/**
 * Walks a route tree and returns the route value declared at the given path,
 * matching each URL pattern segment-by-segment. The root `/` pattern is
 * transparent: its children are searched with the full path.
 *
 * Exported for unit testing only — consumers should go through
 * {@link createNestedHooks}.
 *
 * @internal
 */
export const walkRoute = (
  routes: Record<string, NestedRoute<any, any, any>>,
  path: string,
): NestedRoute<any, any, any> | undefined => {
  for (const [pattern, route] of Object.entries(routes)) {
    if (pattern === path) return route
    if (pattern === '/' && route.children) {
      const nested = walkRoute(route.children, path)
      if (nested) return nested
    } else if (route.children && path.startsWith(pattern)) {
      const rest = path.slice(pattern.length)
      if (rest.startsWith('/') || rest === '') {
        const nested = walkRoute(route.children, rest || '/')
        if (nested) return nested
      }
    }
  }
  return undefined
}

/**
 * Creates a pair of type-safe synchronous read helpers (`getTypedQuery`,
 * `getTypedHash`) bound to a specific route tree. The returned functions
 * validate the current URL's query and hash against the route declared at
 * the given path, returning typed values or `null`/`undefined` on mismatch.
 *
 * The concrete route tree is captured at factory time, so call sites only
 * pass `(injector, path)`; the type-level narrowing is derived from the
 * inferred tree generic.
 *
 * @typeParam TRoutes - The route tree type (inferred from the `routes` argument)
 *
 * @example
 * ```typescript
 * const { getTypedQuery, getTypedHash } = createNestedHooks(appRoutes)
 *
 * const query = getTypedQuery(injector, '/users') // typed
 * const hash = getTypedHash(injector, '/users')   // typed
 * ```
 */
export const createNestedHooks = <TRoutes extends Record<string, NestedRoute<any, any, any>>>(
  routes: TRoutes,
): NestedHooks<TRoutes> => {
  return {
    getTypedQuery: (injector, path) => {
      const route = walkRoute(routes, path)
      if (!route?.query) return null
      const locationService = injector.getInstance(LocationService)
      const deserialized = locationService.onDeserializedLocationSearchChanged.getValue()
      return route.query(deserialized) as never
    },
    getTypedHash: (injector, path) => {
      const route = walkRoute(routes, path)
      const declaredHash = route?.hash as readonly string[] | undefined
      if (!declaredHash) return undefined
      const locationService = injector.getInstance(LocationService)
      const currentHash = locationService.onLocationHashChanged.getValue()
      return declaredHash.includes(currentHash) ? (currentHash as never) : undefined
    },
  }
}
