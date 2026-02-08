import { createComponent, NestedRouter, Shade } from '@furystack/shades'

import { NotFoundPage } from './components/not-found-page.js'
import { appRoutes } from './routes.js'

/**
 * Root App component using NestedRouter for hierarchical routing.
 * Layout test pages render standalone, while all other pages are wrapped
 * in the main app layout with AppBar navigation.
 */
export const App = Shade({
  tagName: 'shades-app',
  render: () => {
    return <NestedRouter routes={appRoutes} notFound={<NotFoundPage />} />
  },
})
