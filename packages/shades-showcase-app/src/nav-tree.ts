import { extractNavTree, type NavTreeNode } from '@furystack/shades'

import './route-meta-augmentation.js'
import { appRoutes } from './routes.js'

/**
 * The route tree rooted at `/`, used by the sidebar and AppBar as the sole
 * source for category / page navigation nodes.
 */
export type AppCategoryRoutes = (typeof appRoutes)['/']['children']

/**
 * A strongly-typed nav tree node scoped to the showcase app's category routes.
 * `fullPath` narrows to the union of routes reachable under `/`, so consumers
 * can pass it directly to `ShowcaseNestedRouteLink` / `showcaseNavigate`
 * without casts.
 */
export type AppNavTreeNode = NavTreeNode<AppCategoryRoutes>

let categoryNodes: AppNavTreeNode[] | undefined

/**
 * Returns the navigation tree for the top-level categories under the root `/`
 * route. The result is lazily computed and cached.
 */
export const getCategoryNodes = (): AppNavTreeNode[] => (categoryNodes ??= extractNavTree(appRoutes['/'].children, '/'))
