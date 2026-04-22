import { createComponent, Shade } from '@furystack/shades'
import { AppBar, createAppBarLink, cssVariableTheme, Divider } from '@furystack/shades-common-components'

import { getCategoryNodes } from '../nav-tree.js'
import { type appRoutes as AppRoutes } from '../routes.js'
import { ShowcaseBreadcrumbComponent } from './showcase-breadcrumbs.tsx'
import { ThemeSwitch } from './theme-switch.js'

const ShowcaseAppBarLinks = createAppBarLink<typeof AppRoutes>()

/**
 * Main navigation AppBar for the showcase application.
 * Single-row layout: breadcrumbs, vertical separator, category links, and theme switch.
 */
export const ShowcaseAppBar = Shade({
  customElementName: 'showcase-app-bar',
  css: {
    display: 'flex',
    alignItems: 'center',
    height: 'inherit',
    '& > * a[is="nested-route-link"]': {
      display: 'flex',
      alignItems: 'center',
      height: 'inherit',
      textDecoration: 'none',
      color: 'inherit',
      fontFamily: cssVariableTheme.typography.fontFamily,
      padding: `0 ${cssVariableTheme.spacing.sm}`,
      transition: `color ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.easeInOut}, transform ${cssVariableTheme.transitions.duration.normal} ${cssVariableTheme.transitions.easing.easeInOut}`,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    },
  },
  render: () => {
    return (
      <AppBar style={{ height: 'inherit' }} data-nav-section="app-bar">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: cssVariableTheme.spacing.sm,
            marginRight: cssVariableTheme.spacing.sm,
            whiteSpace: 'nowrap',
          }}
        >
          <ShowcaseBreadcrumbComponent />
        </div>
        <Divider orientation="vertical" />
        <div
          style={{
            display: 'flex',
            flex: '1',
            height: 'inherit',
            gap: '4px',
            overflow: 'hidden',
            overflowX: 'auto',
          }}
        >
          <ShowcaseAppBarLinks path="/">Home</ShowcaseAppBarLinks>
          {getCategoryNodes().map((node) => (
            <ShowcaseAppBarLinks path={node.fullPath} routingOptions={{ end: false }}>
              {node.meta?.title ?? node.pattern}
            </ShowcaseAppBarLinks>
          ))}
          <ShowcaseAppBarLinks path="/layout-tests" routingOptions={{ end: false }}>
            Layout Tests
          </ShowcaseAppBarLinks>
        </div>
        <ThemeSwitch />
      </AppBar>
    )
  },
})
