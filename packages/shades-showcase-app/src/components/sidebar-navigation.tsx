import { createComponent, LocationService, Shade } from '@furystack/shades'
import { cssVariableTheme } from '@furystack/shades-common-components'

import { navigationConfig, type NavCategory, type NavPage } from '../navigation.js'

const SidebarPageLink = Shade<{ category: NavCategory; page: NavPage }>({
  shadowDomName: 'sidebar-page-link',
  render: ({ props, injector, useObservable }) => {
    const locationService = injector.getInstance(LocationService)
    const [currentPath] = useObservable('currentPath', locationService.onLocationPathChanged)

    const href = `/${props.category.slug}/${props.page.slug}`
    const isActive = currentPath === href

    return (
      <a
        href={href}
        onclick={(ev: MouseEvent) => {
          ev.preventDefault()
          history.pushState({}, '', href)
        }}
        style={{
          display: 'block',
          padding: '6px 16px 6px 40px',
          textDecoration: 'none',
          color: isActive ? cssVariableTheme.palette.primary.main : 'inherit',
          fontWeight: isActive ? 'bold' : 'normal',
          fontSize: '0.875rem',
          borderRadius: '4px',
          background: isActive ? 'rgba(128,128,128,0.1)' : 'transparent',
          transition: 'background 0.15s ease',
        }}
      >
        {props.page.label}
      </a>
    )
  },
})

const SidebarCategory = Shade<{ category: NavCategory }>({
  shadowDomName: 'sidebar-category',
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
      <div style={{ marginBottom: '4px' }}>
        <div
          onclick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: isCategoryActive ? 'bold' : 'normal',
            color: isCategoryActive ? cssVariableTheme.palette.primary.main : 'inherit',
            fontSize: '0.9rem',
            userSelect: 'none',
            borderRadius: '4px',
          }}
        >
          <span style={{ fontSize: '0.75rem', width: '12px', textAlign: 'center' }}>{isExpanded ? '▼' : '▶'}</span>
          <span>{props.category.icon}</span>
          <span>{props.category.label}</span>
        </div>
        {isExpanded && (
          <div>
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
  render: () => {
    return (
      <nav style={{ padding: '8px 0', height: '100%', overflow: 'auto' }}>
        <a
          href="/"
          onclick={(ev: MouseEvent) => {
            ev.preventDefault()
            history.pushState({}, '', '/')
          }}
          style={{
            display: 'block',
            padding: '8px 16px',
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            marginBottom: '8px',
          }}
        >
          🏠 Home
        </a>
        {navigationConfig.map((category) => (
          <SidebarCategory category={category} />
        ))}
      </nav>
    )
  },
})
