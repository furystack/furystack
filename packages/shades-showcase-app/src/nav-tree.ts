import { extractNavTree, type NavTreeNode } from '@furystack/shades'

import './route-meta-augmentation.js'
import { appRoutes } from './routes.js'

let categoryNodes: NavTreeNode[] | undefined

/**
 * Returns the navigation tree for the top-level categories under the root `/` route.
 * The result is lazily computed and cached.
 */
export const getCategoryNodes = (): NavTreeNode[] => (categoryNodes ??= extractNavTree(appRoutes['/'].children, '/'))
