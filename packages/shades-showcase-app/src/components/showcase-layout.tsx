import { createComponent, Shade } from '@furystack/shades'
import { PageLayout } from '@furystack/shades-common-components'

import { ShowcaseAppBar } from './showcase-app-bar.js'
import { SidebarNavigation } from './sidebar-navigation.js'

/**
 * Main layout shell for the showcase application.
 * Wraps content in a PageLayout with the showcase AppBar navigation
 * and a collapsible left sidebar drawer.
 */
export const ShowcaseLayout = Shade({
  shadowDomName: 'showcase-layout',
  render: ({ children }) => (
    <PageLayout
      topGap="12px"
      appBar={{
        variant: 'permanent',
        component: <ShowcaseAppBar />,
      }}
      drawer={{
        left: {
          variant: 'collapsible',
          component: <SidebarNavigation />,
          collapseOnBreakpoint: 'md',
        },
      }}
    >
      {children}
    </PageLayout>
  ),
})
