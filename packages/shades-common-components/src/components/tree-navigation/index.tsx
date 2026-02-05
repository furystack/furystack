import { createComponent, LocationService, RouteLink, Shade } from '@furystack/shades'
import { ObservableValue } from '@furystack/utils'
import { cssVariableTheme } from '../../services/css-variable-theme.js'

/**
 * Represents a single item in the tree navigation
 */
export type TreeNavigationItem = {
  /** Display label for the navigation item */
  label: string
  /** Route path - if provided, the item is navigable */
  path?: string
  /** Optional icon (emoji or text) displayed before the label */
  icon?: string
  /** Child navigation items for nested navigation */
  children?: TreeNavigationItem[]
  /** Additional metadata for extensibility */
  metadata?: Record<string, unknown>
}

/**
 * Props for the TreeNavigation component
 */
export type TreeNavigationProps = {
  /** Array of navigation items to display */
  items: TreeNavigationItem[]
  /** Callback when a navigation item is clicked */
  onNavigate?: (item: TreeNavigationItem) => void
  /** Current active path for highlighting */
  currentPath?: string
  /** Whether sections should be expanded by default */
  expandedByDefault?: boolean
  /** Maximum nesting depth (default: 3) */
  maxDepth?: number
  /** Storage key for persisting expanded state (default: 'tree-nav-expanded') */
  storageKey?: string
}

const STORAGE_KEY_DEFAULT = 'tree-nav-expanded'

/**
 * Get persisted expanded paths from localStorage
 */
const getPersistedExpanded = (storageKey: string): Set<string> => {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        const strings = parsed.filter((item): item is string => typeof item === 'string')
        return new Set(strings)
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return new Set()
}

/**
 * Persist expanded paths to localStorage
 */
const persistExpanded = (storageKey: string, expanded: Set<string>) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...expanded]))
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Check if a path matches the current location (exact or partial for parent paths)
 */
const isPathActive = (itemPath: string, currentPath: string): boolean => {
  if (itemPath === currentPath) return true
  // For root path, only match exactly
  if (itemPath === '/') return currentPath === '/'
  // For other paths, check if current path starts with item path
  return currentPath.startsWith(`${itemPath}/`)
}

/**
 * Check if any child item is active (used to auto-expand parent sections)
 */
const hasActiveChild = (item: TreeNavigationItem, currentPath: string): boolean => {
  if (item.path && isPathActive(item.path, currentPath)) return true
  if (item.children) {
    return item.children.some((child) => hasActiveChild(child, currentPath))
  }
  return false
}

/**
 * Generate a unique key for a navigation item based on its path or label
 */
const getItemKey = (item: TreeNavigationItem, parentKey = ''): string => {
  const key = item.path || item.label
  return parentKey ? `${parentKey}/${key}` : key
}

/**
 * Props for the TreeNavigationItem component
 */
type TreeNavigationItemProps = {
  item: TreeNavigationItem
  depth: number
  maxDepth: number
  currentPath: string
  expandedPaths: ObservableValue<Set<string>>
  storageKey: string
  onNavigate?: (item: TreeNavigationItem) => void
  parentKey?: string
}

/**
 * Internal component for rendering a single navigation item
 */
const TreeNavigationItemComponent = Shade<TreeNavigationItemProps>({
  shadowDomName: 'shade-tree-navigation-item',
  css: {
    display: 'block',
    '& .nav-item': {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 16px',
      cursor: 'pointer',
      textDecoration: 'none',
      color: cssVariableTheme.text.secondary,
      transition: 'background-color 0.2s ease, color 0.2s ease',
      borderRadius: '4px',
      margin: '2px 8px',
      gap: '8px',
      userSelect: 'none',
    },
    '& .nav-item:hover': {
      backgroundColor: cssVariableTheme.button.hover,
      color: cssVariableTheme.text.primary,
    },
    '& .nav-item.active': {
      backgroundColor: cssVariableTheme.palette.primary.main,
      color: cssVariableTheme.palette.primary.mainContrast,
    },
    '& .nav-item.has-active-child': {
      color: cssVariableTheme.text.primary,
      fontWeight: '500',
    },
    '& .nav-icon': {
      flexShrink: '0',
      width: '20px',
      textAlign: 'center',
    },
    '& .nav-label': {
      flex: '1',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .nav-expand-icon': {
      flexShrink: '0',
      transition: 'transform 0.2s ease',
      fontSize: '12px',
    },
    '& .nav-expand-icon.expanded': {
      transform: 'rotate(90deg)',
    },
    '& .nav-children': {
      overflow: 'hidden',
      transition: 'max-height 0.3s ease-out, opacity 0.2s ease-out',
      maxHeight: '0',
      opacity: '0',
    },
    '& .nav-children.expanded': {
      maxHeight: '2000px',
      opacity: '1',
    },
  },
  render: ({ props, useObservable }) => {
    const { item, depth, maxDepth, currentPath, expandedPaths, storageKey, onNavigate, parentKey } = props

    const itemKey = getItemKey(item, parentKey)
    const hasChildren = item.children && item.children.length > 0 && depth < maxDepth
    const isActive = item.path ? isPathActive(item.path, currentPath) : false
    const hasActive = hasActiveChild(item, currentPath)

    const [expanded] = useObservable('expanded', expandedPaths)
    const isExpanded = expanded.has(itemKey) || (hasActive && !expanded.has(`${itemKey}-collapsed`))

    const toggleExpanded = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()

      const newExpanded = new Set(expandedPaths.getValue())
      if (isExpanded) {
        newExpanded.delete(itemKey)
        // Mark as explicitly collapsed if it has active children
        if (hasActive) {
          newExpanded.add(`${itemKey}-collapsed`)
        }
      } else {
        newExpanded.add(itemKey)
        newExpanded.delete(`${itemKey}-collapsed`)
      }
      expandedPaths.setValue(newExpanded)
      persistExpanded(storageKey, newExpanded)
    }

    const handleItemClick = (e: Event) => {
      if (hasChildren && !item.path) {
        // If it's a parent without a path, toggle expansion
        toggleExpanded(e)
      } else if (onNavigate && item.path) {
        onNavigate(item)
      }
    }

    const paddingLeft = `${16 + depth * 16}px`

    const itemClasses = ['nav-item']
    if (isActive) itemClasses.push('active')
    if (hasActive && !isActive) itemClasses.push('has-active-child')

    const renderItem = () => (
      <div
        className={itemClasses.join(' ')}
        style={{ paddingLeft }}
        onclick={handleItemClick}
        role={hasChildren ? 'button' : 'link'}
        aria-expanded={hasChildren ? isExpanded : undefined}
        tabIndex={0}
        onkeydown={(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleItemClick(e)
          }
        }}
      >
        {item.icon && <span className="nav-icon">{item.icon}</span>}
        <span className="nav-label">{item.label}</span>
        {hasChildren && (
          <span
            className={`nav-expand-icon ${isExpanded ? 'expanded' : ''}`}
            onclick={toggleExpanded}
            role="button"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            ▶
          </span>
        )}
      </div>
    )

    return (
      <>
        {item.path && !hasChildren ? (
          <RouteLink href={item.path} style={{ textDecoration: 'none', display: 'block' }}>
            {renderItem()}
          </RouteLink>
        ) : (
          renderItem()
        )}
        {hasChildren && (
          <div className={`nav-children ${isExpanded ? 'expanded' : ''}`} role="group">
            {item.children!.map((child) => (
              <TreeNavigationItemComponent
                item={child}
                depth={depth + 1}
                maxDepth={maxDepth}
                currentPath={currentPath}
                expandedPaths={expandedPaths}
                storageKey={storageKey}
                onNavigate={onNavigate}
                parentKey={itemKey}
              />
            ))}
          </div>
        )}
      </>
    )
  },
})

/**
 * A generic tree navigation component for hierarchical navigation menus.
 *
 * Features:
 * - Expandable/collapsible sections with smooth animations
 * - Active path highlighting with partial path matching
 * - Auto-expands parent sections when a child is active
 * - Persists expanded state in localStorage
 * - Keyboard navigation support
 * - Accessible with ARIA attributes
 * - Theme-aware styling
 *
 * @example
 * ```tsx
 * const items: TreeNavigationItem[] = [
 *   { label: 'Home', path: '/', icon: '🏠' },
 *   {
 *     label: 'Components',
 *     icon: '🧩',
 *     children: [
 *       { label: 'Buttons', path: '/components/buttons' },
 *       { label: 'Inputs', path: '/components/inputs' },
 *     ],
 *   },
 * ]
 *
 * <TreeNavigation items={items} />
 * ```
 */
export const TreeNavigation = Shade<TreeNavigationProps>({
  shadowDomName: 'shade-tree-navigation',
  css: {
    display: 'block',
    padding: '8px 0',
    fontFamily: 'inherit',
    fontSize: '14px',
  },
  render: ({ props, useObservable, useDisposable, injector }) => {
    const { items, onNavigate, expandedByDefault = false, maxDepth = 3, storageKey = STORAGE_KEY_DEFAULT } = props

    const locationService = injector.getInstance(LocationService)
    const [currentPath] = useObservable('location', locationService.onLocationPathChanged)

    // Initialize expanded paths from storage or defaults
    const expandedPaths = useDisposable('expandedPaths', () => {
      const persisted = getPersistedExpanded(storageKey)

      // If expandedByDefault is true and nothing is persisted, expand all parent items
      if (expandedByDefault && persisted.size === 0) {
        const expandAll = (navItems: TreeNavigationItem[], parentKey = ''): Set<string> => {
          const keys = new Set<string>()
          for (const item of navItems) {
            if (item.children && item.children.length > 0) {
              const key = getItemKey(item, parentKey)
              keys.add(key)
              const childKeys = expandAll(item.children, key)
              childKeys.forEach((k) => keys.add(k))
            }
          }
          return keys
        }
        return new ObservableValue(expandAll(items))
      }

      return new ObservableValue(persisted)
    })

    return (
      <nav role="navigation" aria-label="Tree navigation">
        {items.map((item) => (
          <TreeNavigationItemComponent
            item={item}
            depth={0}
            maxDepth={maxDepth}
            currentPath={currentPath}
            expandedPaths={expandedPaths}
            storageKey={storageKey}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    )
  },
})
