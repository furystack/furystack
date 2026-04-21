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
    routes: TRoutes,
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
    routes: TRoutes,
  ) => ExtractRouteHash<RouteAt<TRoutes, TPath>> | undefined
}

const walkRoute = (
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
 * Pass the concrete route tree as the third argument to each helper so the
 * runtime can locate the declared validator / hash tuple; the type-level
 * narrowing is derived from the generic parameter at creation time.
 *
 * @typeParam TRoutes - The route tree type (use `typeof yourRoutes`)
 *
 * @example
 * ```typescript
 * const { getTypedQuery, getTypedHash } = createNestedHooks<typeof appRoutes>()
 *
 * const query = getTypedQuery(injector, '/users', appRoutes) // typed
 * const hash = getTypedHash(injector, '/users', appRoutes)   // typed
 * ```
 */
export const createNestedHooks = <
  TRoutes extends Record<string, NestedRoute<any, any, any>>,
>(): NestedHooks<TRoutes> => {
  return {
    getTypedQuery: (injector, path, routes) => {
      const route = walkRoute(routes, path)
      if (!route?.query) return null
      const locationService = injector.getInstance(LocationService)
      const deserialized = locationService.onDeserializedLocationSearchChanged.getValue()
      return route.query(deserialized) as never
    },
    getTypedHash: (injector, path, routes) => {
      const route = walkRoute(routes, path)
      const declaredHash = route?.hash as readonly string[] | undefined
      if (!declaredHash) return undefined
      const locationService = injector.getInstance(LocationService)
      const currentHash = locationService.onLocationHashChanged.getValue()
      return declaredHash.includes(currentHash) ? (currentHash as never) : undefined
    },
  }
}
