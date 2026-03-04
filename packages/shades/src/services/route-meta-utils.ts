import type { Injector } from '@furystack/inject'

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
 */
export type NavTreeNode = {
  pattern: string
  fullPath: string
  meta?: NestedRouteMeta
  children?: NavTreeNode[]
}

/**
 * Extracts a navigation tree from route definitions.
 * Useful for rendering sidebar navigation or sitemap-like structures.
 * @param routes - The route definitions to extract from
 * @param parentPath - The parent path prefix (used internally for recursion)
 * @returns An array of navigation tree nodes
 */
export const extractNavTree = (routes: Record<string, NestedRoute<unknown>>, parentPath?: string): NavTreeNode[] => {
  return Object.entries(routes).map(([pattern, route]) => {
    const fullPath = parentPath ? `${parentPath === '/' ? '' : parentPath}${pattern}` : pattern
    return {
      pattern,
      fullPath,
      meta: route.meta,
      children: route.children ? extractNavTree(route.children, fullPath) : undefined,
    }
  })
}
