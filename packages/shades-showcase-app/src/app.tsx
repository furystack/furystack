import { createComponent, LazyLoad, RouteLink, Router, Shade } from '@furystack/shades'
import { AppBar } from '@furystack/shades-common-components'
import { HomePage } from './pages/home'

export const App = Shade({
  shadowDomName: 'shades-app',
  render: () => {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'fixed',
          top: '0',
          left: '0',
        }}
      >
        <AppBar>
          Showcase App
          <RouteLink href="/buttons">Buttons</RouteLink>
        </AppBar>
        <div
          style={{
            paddingTop: '48px',
            position: 'fixed',
            top: '0',
            left: '0',
            overflow: 'auto',
            height: 'calc(100% - 48px)',
          }}
        >
          <Router
            routes={[
              {
                url: '/buttons',
                component: () => (
                  <LazyLoad
                    loader={<div>loading...</div>}
                    component={async () => {
                      const { ButtonsPage } = await import('./pages/buttons')
                      return <ButtonsPage />
                    }}
                  />
                ),
              },
            ]}
            notFound={() => <HomePage />}
          />
        </div>
      </div>
    )
  },
})
