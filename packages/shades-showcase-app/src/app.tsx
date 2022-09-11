import { createComponent, LazyLoad, Router, Shade } from '@furystack/shades'
import { AppBar, AppBarLink, Paper, ThemeProviderService } from '@furystack/shades-common-components'
import { PageLoader } from './components/page-loader'
import { ThemeSwitch } from './components/theme-switch'

export const App = Shade({
  shadowDomName: 'shades-app',
  resources: ({ injector, element }) => [
    injector.getInstance(ThemeProviderService).theme.subscribe((theme) => {
      ;(element.firstElementChild as HTMLDivElement).style.backgroundColor = theme.background.default
    }, true),
  ],
  render: () => {
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
        }}
      >
        <AppBar>
          <h3 style={{ margin: '0', paddingLeft: '16px' }}>Showcase App</h3>
          <div style={{ display: 'flex', height: '32px', paddingLeft: '16px', gap: '4px' }}>
            <AppBarLink href="/">Home</AppBarLink>
            <AppBarLink href="/buttons">Buttons</AppBarLink>
            <AppBarLink href="/inputs">Inputs</AppBarLink>
            <AppBarLink href="/grid">Grid</AppBarLink>
            <AppBarLink href="/nipple">Nipple</AppBarLink>
            <AppBarLink href="/lottie">Lottie</AppBarLink>
            <AppBarLink href="/monaco">Monaco</AppBarLink>
            <AppBarLink href="/wizard">Wizard</AppBarLink>
            <AppBarLink href="/notys">Notys</AppBarLink>
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
            ]}
            notFound={() => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { HomePage } = await import('./pages/home')
                  return <HomePage />
                }}
              />
            )}
          />
        </Paper>
      </div>
    )
  },
})
