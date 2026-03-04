import { createComponent, extractNavTree, Shade, type ExtractRoutePaths, type NavTreeNode } from '@furystack/shades'
import { AppBar, createAppBarLink, cssVariableTheme, Divider } from '@furystack/shades-common-components'

import '../route-meta-augmentation.js'
import { appRoutes, type appRoutes as AppRoutes } from '../routes.js'
import { ShowcaseBreadcrumbComponent } from './showcase-breadcrumbs.tsx'
import { ThemeSwitch } from './theme-switch.js'

type AppRoutePath = ExtractRoutePaths<typeof AppRoutes>
const ShowcaseAppBarLinks = createAppBarLink<typeof AppRoutes>()

let categoryNodes: NavTreeNode[] | undefined
const getCategoryNodes = () => (categoryNodes ??= extractNavTree(appRoutes['/'].children, '/'))

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
          {getCategoryNodes().map((node) => (
            <ShowcaseAppBarLinks href={node.fullPath as AppRoutePath} routingOptions={{ end: false }}>
              {node.meta?.title ?? node.pattern}
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
