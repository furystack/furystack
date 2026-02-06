import { createComponent, NestedRouter, Shade } from '@furystack/shades'
import { appRoutes } from './routes.js'

/**
 * Root App component using NestedRouter for hierarchical routing.
 * Layout test pages render standalone, while all other pages are wrapped
 * in the main app layout with AppBar navigation.
 */
export const App = Shade({
  shadowDomName: 'shades-app',
  render: () => {
    return (
      <NestedRouter
        routes={appRoutes}
        notFound={
          <div style={{ paddingTop: '50px', textAlign: 'center' }}>
            <h1>404 🔍</h1>
            <p>Have you seen this cat? 😸</p>
          </div>
        }
      />
    )
  },
})
