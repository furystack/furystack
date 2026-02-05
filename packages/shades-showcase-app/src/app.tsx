import { createComponent, LazyLoad, Router, Shade } from '@furystack/shades'
import { AppBar, AppBarLink, fadeIn, fadeOut, PageLayout } from '@furystack/shades-common-components'
import { sleepAsync } from '@furystack/utils'
import { PageLoader } from './components/page-loader.js'
import { ThemeSwitch } from './components/theme-switch.js'

/**
 * Main application layout with AppBar and navigation
 */
const MainApp = Shade({
  shadowDomName: 'shades-main-app',
  render: () => {
    return (
      <PageLayout
        topGap="12px"
        appBar={{
          variant: 'permanent',
          component: (
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
                <AppBarLink href="/layout-tests">Layout Tests</AppBarLink>
              </div>
              <ThemeSwitch />
            </AppBar>
          ),
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
                    const { ButtonsPage } = await import('./pages/components/form-controls/buttons.js')
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
                    const { FormPage } = await import('./pages/components/form-controls/form.js')
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
                    const { InputsPage } = await import('./pages/components/form-controls/inputs.js')
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
                    const { GridPage } = await import('./pages/components/data-display/grid/index.js')
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
                    const { NipplePage } = await import('./pages/advanced/nipple.js')
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
                    const { LottiePage } = await import('./pages/advanced/lottie.js')
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
                    const { MonacoEditorPage } = await import('./pages/advanced/monaco.js')
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
                    const { WizardPage } = await import('./pages/advanced/wizard/index.js')
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
                    const { NotysPage } = await import('./pages/components/feedback/notys.js')
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
                    const { TabsPage } = await import('./pages/components/data-display/tabs.js')
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
                    const { I18NPage } = await import('./pages/advanced/i18n/i18n.tsx')
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
                      const { MFEPage } = await import('./pages/advanced/mfe/mfe-page.js')
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
      </PageLayout>
    )
  },
})

/**
 * Root App component with top-level routing.
 * Layout test pages render standalone (without the main app's PageLayout).
 */
export const App = Shade({
  shadowDomName: 'shades-app',
  render: () => {
    return (
      <Router
        routes={[
          {
            url: '/layout-tests/appbar-only',
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { AppBarOnlyTest } = await import('./pages/layouts/variants/index.js')
                  return <AppBarOnlyTest />
                }}
              />
            ),
          },
          {
            url: '/layout-tests/appbar-left-drawer',
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { AppBarLeftDrawerTest } = await import('./pages/layouts/variants/index.js')
                  return <AppBarLeftDrawerTest />
                }}
              />
            ),
          },
          {
            url: '/layout-tests/appbar-right-drawer',
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { AppBarRightDrawerTest } = await import('./pages/layouts/variants/index.js')
                  return <AppBarRightDrawerTest />
                }}
              />
            ),
          },
          {
            url: '/layout-tests/appbar-both-drawers',
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { AppBarBothDrawersTest } = await import('./pages/layouts/variants/index.js')
                  return <AppBarBothDrawersTest />
                }}
              />
            ),
          },
          {
            url: '/layout-tests/collapsible-drawer',
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { CollapsibleDrawerTest } = await import('./pages/layouts/variants/index.js')
                  return <CollapsibleDrawerTest />
                }}
              />
            ),
          },
          {
            url: '/layout-tests/auto-hide-appbar',
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { AutoHideAppBarTest } = await import('./pages/layouts/variants/index.js')
                  return <AutoHideAppBarTest />
                }}
              />
            ),
          },
          {
            url: '/layout-tests/responsive-layout',
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { ResponsiveLayoutTest } = await import('./pages/layouts/variants/index.js')
                  return <ResponsiveLayoutTest />
                }}
              />
            ),
          },
          {
            url: '/layout-tests/temporary-drawer',
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { TemporaryDrawerTest } = await import('./pages/layouts/variants/index.js')
                  return <TemporaryDrawerTest />
                }}
              />
            ),
          },
          {
            url: '/layout-tests',
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { LayoutTestsIndex } = await import('./pages/layouts/variants/index.js')
                  return <LayoutTestsIndex />
                }}
              />
            ),
          },
        ]}
        notFound={<MainApp />}
      />
    )
  },
})
