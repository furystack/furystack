import { createComponent, Shade, type ExtractRoutePaths } from '@furystack/shades'
import { AppBar, createAppBarLink } from '@furystack/shades-common-components'

import type { appRoutes } from '../routes.tsx'
import { navigationConfig } from '../navigation.js'
import { ShowcaseBreadcrumbComponent } from './showcase-breadcrumbs.tsx'
import { ThemeSwitch } from './theme-switch.js'

type AppRoutePath = ExtractRoutePaths<typeof appRoutes>
const ShowcaseAppBarLinks = createAppBarLink<typeof appRoutes>()

/**
 * Main navigation AppBar for the showcase application.
 * Contains category-level links driven by the navigation config and the theme switcher.
 */
export const ShowcaseAppBar = Shade({
  shadowDomName: 'showcase-app-bar',
  render: () => {
    return (
      <AppBar>
        <div style={{ paddingLeft: '16px', fontSize: '0.9em' }}>
          <ShowcaseBreadcrumbComponent />
        </div>
        <div
          style={{
            display: 'flex',
            height: '32px',
            paddingLeft: '16px',
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
