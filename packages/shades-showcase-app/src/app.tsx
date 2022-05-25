import { createComponent, LazyLoad, Router, Shade } from '@furystack/shades'
import { AppBar, AppBarLink } from '@furystack/shades-common-components'
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
          <h3 style={{ margin: '0', paddingLeft: '16px' }}>Showcase App</h3>
          <div style={{ display: 'flex', height: '32px', paddingLeft: '16px', gap: '4px' }}>
            <AppBarLink href="/">Home</AppBarLink>
            <AppBarLink href="/buttons">Buttons</AppBarLink>
            <AppBarLink href="/inputs">Inputs</AppBarLink>
            <AppBarLink href="/nipple">Nipple</AppBarLink>
            <AppBarLink href="/lottie">Lottie</AppBarLink>
            <AppBarLink href="/monaco">Monaco</AppBarLink>
          </div>
        </AppBar>
        <div
          style={{
            paddingTop: '48px',
            position: 'fixed',
            top: '0',
            left: '0',
            overflow: 'auto',
            height: 'calc(100% - 48px)',
            width: '100%',
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
