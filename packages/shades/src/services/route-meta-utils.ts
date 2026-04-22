import type { Injector } from '@furystack/inject'

import type { ExtractRoutePaths } from '../components/nested-route-types.js'
import type { MatchChainEntry, NestedRoute, NestedRouteMeta } from '../components/nested-router.js'

/**
 * Resolves the title for a single match chain entry.
 * If the title is a function, it is called with `{ match, injector }` (supports async).
 * @param entry - A matched route entry from the match chain
 * @param injector - The injector instance to pass to dynamic title resolvers
 * @returns The resolved title string, or undefined if no title is configured
 */
export const resolveRouteTitle = async (entry: MatchChainEntry, injector: Injector): Promise<string | undefined> => {
  const title = entry.route.meta?.title
  if (typeof title === 'function') return await title({ match: entry.match, injector })
  return title
}

/**
 * Resolves all titles from a match chain in parallel.
 * @param chain - The match chain from outermost to innermost route
 * @param injector - The injector instance to pass to dynamic title resolvers
 * @returns An array of resolved titles (some may be undefined if no title is configured)
 */
export const resolveRouteTitles = async (
  chain: MatchChainEntry[],
  injector: Injector,
): Promise<Array<string | undefined>> => {
  return Promise.all(chain.map((entry) => resolveRouteTitle(entry, injector)))
}

/**
 * Composes resolved titles into a single document title string.
 * Filters out undefined entries before joining.
 * @param titles - Array of resolved titles (may contain undefined)
 * @param options - Formatting options
 * @param options.separator - String placed between title segments (default: `' - '`)
 * @param options.prefix - Optional app name prepended before all segments
 * @returns The composed title string
 *
 * @example
 * ```typescript
 * buildDocumentTitle(['Media', 'Movies', 'Superman'], { prefix: 'My App', separator: ' / ' })
 * // => 'My App / Media / Movies / Superman'
 *
 * buildDocumentTitle(['Settings', undefined, 'Profile'])
 * // => 'Settings - Profile'
 * ```
 */
export const buildDocumentTitle = (
  titles: Array<string | undefined>,
  options?: { separator?: string; prefix?: string },
): string => {
  const { separator = ' - ', prefix } = options ?? {}
  const parts = titles.filter((t): t is string => t != null)
  return prefix ? [prefix, ...parts].join(separator) : parts.join(separator)
}

/**
 * A node in a navigation tree extracted from route definitions.
 *
 * When {@link extractNavTree} is called with an explicit route tree type
 * parameter (e.g. `extractNavTree<typeof appRoutes>(...)`), `pattern` narrows
 * to the declared route keys and `fullPath` narrows to the union of all
 * composed paths in the subtree. Without a type parameter the generic falls
 * back to a widened shape so ad-hoc consumers keep compiling.
 *
 * @typeParam TRoutes - The route tree the node was extracted from
 */
export type NavTreeNode<
  TRoutes extends Record<string, NestedRoute<any, any, any>> = Record<string, NestedRoute<any, any, any>>,
> = {
  pattern: keyof TRoutes & string
  fullPath: ExtractRoutePaths<TRoutes> & string
  meta?: NestedRouteMeta
  children?: Array<NavTreeNode<TRoutes>>
}

/**
 * Extracts a navigation tree from route definitions.
 *
 * The returned nodes preserve the route tree's static typing: `pattern` is
 * narrowed to the declared keys of `TRoutes` and `fullPath` is narrowed to
 * the union of composed paths reachable from `TRoutes` (as produced by
 * {@link ExtractRoutePaths}). This makes the output a single, typed source
 * of truth for sidebar navigation, breadcrumbs and other route-tree-aware
 * UIs — without requiring `as` casts at the call site.
 *
 * Child nodes share their parent's `TRoutes` type parameter; the resulting
 * union is a safe upper bound of the actual paths at any depth, which keeps
 * the helper simple while still accepted by `createNestedRouteLink`,
 * `createNestedNavigate` and `createNestedReplace` factories bound to the
 * same route tree.
 *
 * @param routes - The route definitions to extract from
 * @param parentPath - The parent path prefix (used internally for recursion)
 * @returns An array of navigation tree nodes
 */
export const extractNavTree = <TRoutes extends Record<string, NestedRoute<any, any, any>>>(
  routes: TRoutes,
  parentPath?: string,
): Array<NavTreeNode<TRoutes>> => {
  const build = (rs: Record<string, NestedRoute<any, any, any>>, pp?: string): Array<NavTreeNode<TRoutes>> =>
    Object.entries(rs).map(([pattern, route]) => {
      const fullPath = pp ? `${pp === '/' ? '' : pp}${pattern}` : pattern
      return {
        pattern,
        fullPath,
        meta: route.meta,
        children: route.children ? build(route.children, fullPath) : undefined,
      } as NavTreeNode<TRoutes>
    })
  return build(routes, parentPath)
}
