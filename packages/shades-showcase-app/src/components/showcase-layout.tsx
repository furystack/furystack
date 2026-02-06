import { createComponent, Shade } from '@furystack/shades'
import { PageLayout } from '@furystack/shades-common-components'

import { ShowcaseAppBar } from './showcase-app-bar.js'

/**
 * Main layout shell for the showcase application.
 * Wraps content in a PageLayout with the showcase AppBar navigation.
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
    >
      {children}
    </PageLayout>
  ),
})
