import { createComponent, LazyLoad, Router, Shade } from '@furystack/shades'
import { AppBar, AppBarLink, fadeIn, fadeOut, Paper, ThemeProviderService } from '@furystack/shades-common-components'
import { PageLoader } from './components/page-loader'
import { ThemeSwitch } from './components/theme-switch'

export const App = Shade({
  shadowDomName: 'shades-app',
  render: ({ injector }) => {
    const { theme } = injector.getInstance(ThemeProviderService)
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'fixed',
          top: '0',
          left: '0',
          padding: '0',
          margin: '0',
          background: theme.background.default,
        }}
      >
        <AppBar>
          <h3 style={{ margin: '0', paddingLeft: '16px' }}>Showcase App</h3>
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
            <AppBarLink href="/">Home</AppBarLink>
            <AppBarLink href="/buttons">Buttons</AppBarLink>
            <AppBarLink href="/inputs">Inputs</AppBarLink>
            <AppBarLink href="/grid">Grid</AppBarLink>
            <AppBarLink href="/nipple">Nipple</AppBarLink>
            <AppBarLink href="/lottie">Lottie</AppBarLink>
            <AppBarLink href="/monaco">Monaco</AppBarLink>
            <AppBarLink href="/wizard">Wizard</AppBarLink>
            <AppBarLink href="/notys">Notys</AppBarLink>
            <AppBarLink href="/tabs">Tabs</AppBarLink>
            <AppBarLink href="/misc">Misc</AppBarLink>
          </div>
          <ThemeSwitch />
        </AppBar>
        <Paper
          elevation={3}
          style={{
            paddingTop: '32px',
            position: 'fixed',
            top: '0',
            left: '0',
            overflow: 'auto',
            height: 'calc(100% - 64px)',
            width: 'calc(100% - 48px)',
            textAlign: 'justify',
          }}
        >
          <Router
            routes={[
              {
                url: '/buttons',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { ButtonsPage } = await import('./pages/buttons')
                      return <ButtonsPage />
                    }}
                  />
                ),
              },
              {
                url: '/inputs',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { InputsPage } = await import('./pages/inputs')
                      return <InputsPage />
                    }}
                  />
                ),
              },
              {
                url: '/grid',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { GridPage } = await import('./pages/grid')
                      return <GridPage />
                    }}
                  />
                ),
              },
              {
                url: '/nipple',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { NipplePage } = await import('./pages/nipple')
                      return <NipplePage />
                    }}
                  />
                ),
              },
              {
                url: '/lottie',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { LottiePage } = await import('./pages/lottie')
                      return <LottiePage />
                    }}
                  />
                ),
              },
              {
                url: '/monaco',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { MonacoEditorPage } = await import('./pages/monaco')
                      return <MonacoEditorPage />
                    }}
                  />
                ),
              },
              {
                url: '/wizard',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { WizardPage } = await import('./pages/wizard')
                      return <WizardPage />
                    }}
                  />
                ),
              },
              {
                url: '/notys',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { NotysPage } = await import('./pages/notys')
                      return <NotysPage />
                    }}
                  />
                ),
              },
              {
                url: '/tabs',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { TabsPage } = await import('./pages/tabs')
                      return <TabsPage />
                    }}
                  />
                ),
              },
              {
                url: '/misc',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { MiscPage } = await import('./pages/misc')
                      return <MiscPage />
                    }}
                  />
                ),
              },
              {
                url: '/',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => (
                  <LazyLoad
                    loader={<PageLoader />}
                    component={async () => {
                      const { HomePage } = await import('./pages/home')
                      return <HomePage />
                    }}
                  />
                ),
              },
            ]}
            notFound={
              <div style={{ paddingTop: '50px', textAlign: 'center' }}>
                <h1>404 🔍</h1>
                <p>Have you seen this cat? 😸</p>
              </div>
            }
          />
        </Paper>
      </div>
    )
  },
})
