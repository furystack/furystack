import { createComponent, LocationService, NestedRouteLink, Shade, type NavTreeNode } from '@furystack/shades'
import { cssVariableTheme, Icon, icons } from '@furystack/shades-common-components'

import { getCategoryNodes } from '../nav-tree.js'

const SidebarPageLink = Shade<{ node: NavTreeNode; categoryPath: string }>({
  customElementName: 'sidebar-page-link',
  css: {
    display: 'block',
    '& a': {
      display: 'block',
      padding: '7px 16px 7px 44px',
      textDecoration: 'none',
      color: 'inherit',
      fontSize: '0.84rem',
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      borderLeft: '3px solid transparent',
      margin: '1px 8px 1px 0',
      transition: `background ${cssVariableTheme.transitions.duration.fast} ease, border-color ${cssVariableTheme.transitions.duration.fast} ease, color ${cssVariableTheme.transitions.duration.fast} ease`,
    },
    '& a:hover': {
      background: cssVariableTheme.action.hoverBackground,
    },
    '& a.active': {
      color: cssVariableTheme.palette.primary.main,
      fontWeight: cssVariableTheme.typography.fontWeight.semibold,
      background: cssVariableTheme.action.hoverBackground,
      borderLeftColor: cssVariableTheme.palette.primary.main,
    },
  },
  render: ({ props, injector, useObservable }) => {
    const locationService = injector.getInstance(LocationService)
    const [currentPath] = useObservable('currentPath', locationService.onLocationPathChanged)

    const href = `${props.categoryPath}${props.node.pattern}`
    const isActive = currentPath === href

    return (
      <a
        href={href}
        className={isActive ? 'active' : ''}
        onclick={(ev: MouseEvent) => {
          ev.preventDefault()
          locationService.navigate(href)
        }}
      >
        {props.node.meta?.title ?? props.node.pattern}
      </a>
    )
  },
})

const SidebarCategory = Shade<{ node: NavTreeNode }>({
  customElementName: 'sidebar-category',
  css: {
    display: 'block',
    marginBottom: '2px',
    '& .category-header': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '0.82rem',
      fontWeight: '500',
      letterSpacing: '0.02em',
      userSelect: 'none',
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      margin: '0 8px',
      transition: `background ${cssVariableTheme.transitions.duration.fast} ease, color ${cssVariableTheme.transitions.duration.fast} ease`,
    },
    '& .category-header:hover': {
      background: cssVariableTheme.action.hoverBackground,
    },
    '& .category-header.active': {
      color: cssVariableTheme.palette.primary.main,
      fontWeight: '600',
    },
    '& .expand-arrow': {
      fontSize: '0.55rem',
      width: '12px',
      textAlign: 'center',
      transition: `transform ${cssVariableTheme.transitions.duration.normal} ease`,
      display: 'inline-block',
    },
    '& .expand-arrow.expanded': {
      transform: 'rotate(90deg)',
    },
    '& .category-children': {
      paddingBottom: '4px',
    },
  },
  render: ({ props, injector, useObservable, useState }) => {
    const locationService = injector.getInstance(LocationService)
    const [currentPath] = useObservable('currentPath', locationService.onLocationPathChanged)

    const categoryPath = props.node.fullPath
    const categoryPrefix = `${categoryPath}/`
    const isCategoryActive = currentPath.startsWith(categoryPrefix) || currentPath === categoryPath

    const [isExpanded, setIsExpanded] = useState('isExpanded', isCategoryActive)

    if (isCategoryActive && !isExpanded) {
      setIsExpanded(true)
    }

    const children = props.node.children ?? []
    const hasChildren = children.length > 0

    const handleHeaderClick = () => {
      if (hasChildren) {
        setIsExpanded(!isExpanded)
      } else {
        locationService.navigate(categoryPath)
      }
    }

    return (
      <div>
        <div
          className={`category-header${isCategoryActive ? ' active' : ''}`}
          onclick={handleHeaderClick}
          onkeydown={(ev: KeyboardEvent) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault()
              handleHeaderClick()
            }
          }}
          tabIndex={0}
          role="button"
        >
          {hasChildren && <span className={`expand-arrow${isExpanded ? ' expanded' : ''}`}>▶</span>}
          {props.node.meta?.icon && <Icon icon={props.node.meta.icon} size={16} />}
          <span>{props.node.meta?.title ?? props.node.pattern}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="category-children">
            {children.map((child) => (
              <SidebarPageLink node={child} categoryPath={categoryPath} />
            ))}
          </div>
        )}
      </div>
    )
  },
})

/**
 * Left sidebar navigation component.
 * Renders the full navigation hierarchy from route metadata with expandable
 * categories and highlights the current page.
 */
export const SidebarNavigation = Shade({
  customElementName: 'sidebar-navigation',
  css: {
    display: 'block',
    height: '100%',
    overflow: 'hidden auto',
    fontFamily: cssVariableTheme.typography.fontFamily,
    color: cssVariableTheme.text.primary,
    scrollbarWidth: 'thin',
    scrollbarGutter: 'stable',
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'transparent',
      borderRadius: '4px',
    },
    '&:hover::-webkit-scrollbar-thumb': {
      background: 'rgba(128,128,128,0.4)',
    },
    '& .sidebar-header': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '16px 20px 12px',
      textDecoration: 'none',
      color: 'inherit',
      fontWeight: '700',
      fontSize: '0.95rem',
      letterSpacing: '0.01em',
      borderRadius: cssVariableTheme.shape.borderRadius.sm,
      margin: '0 8px',
      transition: `background ${cssVariableTheme.transitions.duration.fast} ease`,
    },
    '& .sidebar-header:hover': {
      background: cssVariableTheme.action.hoverBackground,
    },
    '& .sidebar-divider': {
      height: '1px',
      background: cssVariableTheme.divider,
      margin: '4px 16px 8px',
      opacity: '0.6',
    },
    '& .sidebar-section-label': {
      padding: '8px 20px 4px',
      fontSize: '0.68rem',
      fontWeight: '600',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: cssVariableTheme.text.secondary,
      userSelect: 'none',
    },
  },
  render: () => {
    return (
      <nav style={{ padding: '4px 0 8px' }} data-nav-section="sidebar">
        <NestedRouteLink className="sidebar-header" href="/">
          <Icon icon={icons.flame} size={18} />
          <span>FuryStack Shades</span>
        </NestedRouteLink>
        <div className="sidebar-divider" />
        <div className="sidebar-section-label">Components</div>
        {getCategoryNodes().map((node) => (
          <SidebarCategory node={node} />
        ))}
      </nav>
    )
  },
})
