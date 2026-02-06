import { createComponent, Shade, type ExtractRoutePaths } from '@furystack/shades'
import { AppBar, createAppBarLink, cssVariableTheme } from '@furystack/shades-common-components'

import type { appRoutes } from '../routes.tsx'
import { navigationConfig } from '../navigation.js'
import { ShowcaseBreadcrumbComponent } from './showcase-breadcrumbs.tsx'
import { ThemeSwitch } from './theme-switch.js'

type AppRoutePath = ExtractRoutePaths<typeof appRoutes>
const ShowcaseAppBarLinks = createAppBarLink<typeof appRoutes>()

/**
 * Main navigation AppBar for the showcase application.
 * Single-row layout: breadcrumbs, vertical separator, category links, and theme switch.
 */
export const ShowcaseAppBar = Shade({
  shadowDomName: 'showcase-app-bar',
  render: () => {
    return (
      <AppBar>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '12px',
            marginRight: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <ShowcaseBreadcrumbComponent />
        </div>
        <div
          style={{
            width: '1px',
            alignSelf: 'stretch',
            background: cssVariableTheme.divider,
            opacity: '0.4',
            margin: '8px 4px',
          }}
        />
        <div
          style={{
            display: 'flex',
            flex: '1',
            height: '32px',
            gap: '4px',
            overflow: 'hidden',
            overflowX: 'auto',
          }}
        >
          <ShowcaseAppBarLinks href="/">Home</ShowcaseAppBarLinks>
          {navigationConfig.map((category) => (
            <ShowcaseAppBarLinks
              href={`/${category.slug}/${category.children[0].slug}` as AppRoutePath}
              routingOptions={{ end: false }}
            >
              {category.label}
            </ShowcaseAppBarLinks>
          ))}
          <ShowcaseAppBarLinks href="/layout-tests" routingOptions={{ end: false }}>
            Layout Tests
          </ShowcaseAppBarLinks>
        </div>
        <ThemeSwitch />
      </AppBar>
    )
  },
})
