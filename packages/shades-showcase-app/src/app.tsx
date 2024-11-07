import { createComponent, LazyLoad, Router, Shade } from '@furystack/shades'
import { AppBar, AppBarLink, fadeIn, fadeOut, Paper } from '@furystack/shades-common-components'
import { sleepAsync } from '@furystack/utils'
import { PageLoader } from './components/page-loader.js'
import { ThemeSwitch } from './components/theme-switch.js'

export const App = Shade({
  shadowDomName: 'shades-app',
  style: {
    width: '100%',
    height: '100%',
    position: 'fixed',
    top: '0',
    left: '0',
    padding: '0',
    margin: '0',
    background: 'var(--shades-theme-background-default)',
  },
  render: () => {
    return (
      <>
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
            <AppBarLink href="/form">Form</AppBarLink>
            <AppBarLink href="/grid">Grid</AppBarLink>
            <AppBarLink href="/nipple">Nipple</AppBarLink>
            <AppBarLink href="/lottie">Lottie</AppBarLink>
            <AppBarLink href="/monaco">Monaco</AppBarLink>
            <AppBarLink href="/wizard">Wizard</AppBarLink>
            <AppBarLink href="/notys">Notys</AppBarLink>
            <AppBarLink href="/tabs">Tabs</AppBarLink>
            <AppBarLink href="/i18n">I18N</AppBarLink>
            <AppBarLink href="/mfe">MFE</AppBarLink>
            <AppBarLink href="/misc">Misc</AppBarLink>
          </div>
          <ThemeSwitch />
        </AppBar>
        <Paper
          elevation={3}
          style={{
            paddingTop: '32px',
            position: 'fixed',
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
                      const { ButtonsPage } = await import('./pages/buttons.js')
                      await sleepAsync(1000)
                      return <ButtonsPage />
                    }}
                  />
                ),
              },
              {
                url: '/form',
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
                      await sleepAsync(1000)
                      const { FormPage } = await import('./pages/form.js')
                      return <FormPage />
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
                      const { InputsPage } = await import('./pages/inputs.js')
                      return <InputsPage />
                    }}
                  />
                ),
              },
              {
                url: '/form',
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
                      const { FormPage } = await import('./pages/form.js')
                      return <FormPage />
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
                      const { GridPage } = await import('./pages/grid/index.js')
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
                      const { NipplePage } = await import('./pages/nipple.js')
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
                      const { LottiePage } = await import('./pages/lottie.js')
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
                      const { MonacoEditorPage } = await import('./pages/monaco.js')
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
                      const { WizardPage } = await import('./pages/wizard/index.js')
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
                      const { NotysPage } = await import('./pages/notys.js')
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
                      const { TabsPage } = await import('./pages/tabs.js')
                      return <TabsPage />
                    }}
                  />
                ),
              },
              {
                url: '/i18n',
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
                      const { I18NPage } = await import('./pages/i18n/i18n.tsx')
                      return <I18NPage />
                    }}
                  />
                ),
              },
              {
                url: '/mfe',
                onVisit: async ({ element }) => {
                  await fadeIn(element, {})
                },
                onLeave: async ({ element }) => {
                  await fadeOut(element, {})
                },
                component: () => {
                  return (
                    <LazyLoad
                      loader={<PageLoader />}
                      component={async () => {
                        const { MFEPage } = await import('./pages/mfe/mfe-page.js')
                        return <MFEPage />
                      }}
                    />
                  )
                },
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
                      const { MiscPage } = await import('./pages/misc.js')
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
                      const { HomePage } = await import('./pages/home/index.js')
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
      </>
    )
  },
})
