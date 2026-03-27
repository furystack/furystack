import type { Injector } from '@furystack/inject'
import { compileRoute } from '../compile-route.js'
import { LocationService } from '../services/location-service.js'
import type { ExtractRouteParams, ExtractRoutePaths } from './nested-route-types.js'
import type { NestedRoute } from './nested-router.js'

/**
 * Arguments for a type-safe nested navigate call.
 * When the path contains parameters (e.g. `:id`), the `params` argument becomes required.
 * @typeParam TPath - A specific route path string
 */
export type TypedNavigateArgs<TPath extends string> = string extends keyof ExtractRouteParams<TPath>
  ? [path: TPath, params?: Record<string, string>]
  : [path: TPath, params: ExtractRouteParams<TPath>]

/**
 * Navigates to a route path using the LocationService from the given injector.
 * Compiles parameterized routes (e.g. `/users/:id`) when `params` is provided.
 *
 * @param injector - The injector instance to resolve LocationService from
 * @param path - The route path to navigate to
 * @param params - Optional route parameters to compile into the path
 */
export const nestedNavigate = (injector: Injector, path: string, params?: Record<string, string>): void => {
  const resolvedUrl = params ? compileRoute(path, params) : path
  injector.getInstance(LocationService).navigate(resolvedUrl)
}

/**
 * Creates a type-safe navigate function constrained to a specific route tree.
 * The returned function has the same runtime behavior as {@link nestedNavigate}
 * but narrows `path` to only accept valid route paths, and requires `params`
 * when the route has parameters.
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
 * // Type-safe: only valid paths accepted
 * appNavigate(injector, '/buttons')
 *
 * // TypeScript error: invalid path
 * appNavigate(injector, '/nonexistent')
 *
 * // Params required for parameterized routes
 * appNavigate(injector, '/users/:id', { id: '123' })
 * ```
 */
export const createNestedNavigate = <TRoutes extends Record<string, NestedRoute<any>>>() => {
  return nestedNavigate as <TPath extends ExtractRoutePaths<TRoutes>>(
    injector: Injector,
    ...args: TypedNavigateArgs<TPath>
  ) => void
}
