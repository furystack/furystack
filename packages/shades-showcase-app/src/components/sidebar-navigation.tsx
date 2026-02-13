import { createComponent, LocationService, Shade } from '@furystack/shades'
import { cssVariableTheme, Icon, icons } from '@furystack/shades-common-components'

import { navigationConfig, type NavCategory, type NavPage } from '../navigation.js'

const SidebarPageLink = Shade<{ category: NavCategory; page: NavPage }>({
  shadowDomName: 'sidebar-page-link',
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

    const href = `/${props.category.slug}/${props.page.slug}`
    const isActive = currentPath === href

    return (
      <a
        href={href}
        className={isActive ? 'active' : ''}
        onclick={(ev: MouseEvent) => {
          ev.preventDefault()
          history.pushState({}, '', href)
        }}
      >
        {props.page.label}
      </a>
    )
  },
})

const SidebarCategory = Shade<{ category: NavCategory }>({
  shadowDomName: 'sidebar-category',
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

    const categoryPrefix = `/${props.category.slug}/`
    const isCategoryActive = currentPath.startsWith(categoryPrefix) || currentPath === `/${props.category.slug}`

    const [isExpanded, setIsExpanded] = useState('isExpanded', isCategoryActive)

    // Auto-expand when navigating into this category
    if (isCategoryActive && !isExpanded) {
      setIsExpanded(true)
    }

    return (
      <div>
        <div
          className={`category-header${isCategoryActive ? ' active' : ''}`}
          onclick={() => setIsExpanded(!isExpanded)}
        >
          <span className={`expand-arrow${isExpanded ? ' expanded' : ''}`}>▶</span>
          <Icon icon={props.category.icon} size={16} />
          <span>{props.category.label}</span>
        </div>
        {isExpanded && (
          <div className="category-children">
            {props.category.children.map((page) => (
              <SidebarPageLink category={props.category} page={page} />
            ))}
          </div>
        )}
      </div>
    )
  },
})

/**
 * Left sidebar navigation component.
 * Renders the full navigation hierarchy with expandable categories
 * and highlights the current page.
 */
export const SidebarNavigation = Shade({
  shadowDomName: 'sidebar-navigation',
  css: {
    display: 'block',
    height: '100%',
    overflow: 'hidden auto',
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
      <nav style={{ padding: '4px 0 8px' }}>
        <a
          className="sidebar-header"
          href="/"
          onclick={(ev: MouseEvent) => {
            ev.preventDefault()
            history.pushState({}, '', '/')
          }}
        >
          <Icon icon={icons.flame} size={18} />
          <span>FuryStack Shades</span>
        </a>
        <div className="sidebar-divider" />
        <div className="sidebar-section-label">Components</div>
        {navigationConfig.map((category) => (
          <SidebarCategory category={category} />
        ))}
      </nav>
    )
  },
})
