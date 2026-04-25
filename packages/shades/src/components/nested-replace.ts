import type { Injector } from '@furystack/inject'
import { LocationService } from '../services/location-service.js'
import type { NestedNavigateArgs, TypedNestedNavigateArgs } from './nested-navigate.js'
import { buildNestedNavigateUrl } from './nested-navigate.js'
import type { ExtractRoutePaths } from './nested-route-types.js'
import type { NestedRoute } from './nested-router.js'

/**
 * Replaces the current history entry with a route using the LocationService
 * resolved from the given injector. Has the same URL-composition semantics as
 * `nestedNavigate`, but calls `history.replaceState` under the hood so the
 * intermediate URL does not appear in the browser's back / forward stack.
 *
 * Use this for SPA redirects (e.g. canonicalization, auth guards) where the
 * caller's URL should not be recoverable with the Back button.
 *
 * @param injector - The injector instance to resolve LocationService from
 * @param args - The navigation arguments
 */
export const nestedReplace = (injector: Injector, args: NestedNavigateArgs): void => {
  injector.get(LocationService).replace(buildNestedNavigateUrl(args))
}

/**
 * Creates a type-safe replace function constrained to a specific route tree.
 * The returned function has the same runtime behavior as {@link nestedReplace}
 * but narrows `path` to valid route paths, requires `params` when the route has
 * parameters, and enforces the route's declared `query` and `hash` schemas.
 *
 * @typeParam TRoutes - The route tree type (use `typeof yourRoutes`)
 * @returns A type-safe replace function
 *
 * @example
 * ```typescript
 * const appReplace = createNestedReplace<typeof appRoutes>()
 *
 * // Redirect an unauthenticated visitor without polluting history
 * appReplace(injector, { path: '/login' })
 * ```
 */
export const createNestedReplace = <TRoutes extends Record<string, NestedRoute<any, any, any>>>() => {
  return nestedReplace as <TPath extends ExtractRoutePaths<TRoutes>>(
    injector: Injector,
    args: TypedNestedNavigateArgs<TRoutes, TPath>,
  ) => void
}
