import type { NestedRoute } from './nested-router.js'

/**
 * Identity helper that preserves the exact inferred literal type of a nested
 * route tree while still applying a structural `Record<string, NestedRoute<...>>`
 * constraint for compile-time validation.
 *
 * Using a plain `satisfies Record<string, NestedRoute<any>>` assertion collapses
 * the per-route `query` / `hash` generics to their defaults, which defeats the
 * type-safe navigation helpers (`createNestedRouteLink`, `createNestedNavigate`,
 * `createNestedHooks`). Declaring route trees through this helper keeps the
 * literal shape intact so downstream extractors can recover each route's
 * declared query validator return type and hash literal tuple.
 *
 * @example
 * ```typescript
 * const routes = defineNestedRoutes({
 *   '/users/:id': {
 *     component: ({ match, query, hash }) => ...,
 *     hash: ['profile', 'settings'] as const,
 *     query: (raw): { page: number } | null =>
 *       typeof raw.page === 'number' ? { page: raw.page } : null,
 *   },
 * })
 * ```
 */
export const defineNestedRoutes = <T extends Record<string, NestedRoute<any, any, any>>>(routes: T): T => routes
