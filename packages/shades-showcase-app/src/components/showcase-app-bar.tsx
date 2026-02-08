import { createComponent, Shade, type ExtractRoutePaths } from '@furystack/shades'
import { AppBar, createAppBarLink, cssVariableTheme, Divider } from '@furystack/shades-common-components'

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
  tagName: 'showcase-app-bar',
  render: () => {
    return (
      <AppBar>
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
        <Divider
          orientation="vertical"
          style={{ margin: `${cssVariableTheme.spacing.sm} ${cssVariableTheme.spacing.xs}`, opacity: '0.4' }}
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
            <ShowcaseAppBarLinks href={`/${category.slug}` as AppRoutePath} routingOptions={{ end: false }}>
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
