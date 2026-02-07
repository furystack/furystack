import type { NestedRoute } from '@furystack/shades'
import { createComponent, LazyLoad } from '@furystack/shades'
import { fadeIn, fadeOut } from '@furystack/shades-common-components'
import { sleepAsync } from '@furystack/utils'

import { Navigate } from './components/navigate.js'
import { PageLoader } from './components/page-loader.js'
import { ShowcaseLayout } from './components/showcase-layout.js'

const withFadeTransition = {
  onVisit: async ({ element }: { element: JSX.Element }) => {
    await fadeIn(element, {})
  },
  onLeave: async ({ element }: { element: JSX.Element }) => {
    await fadeOut(element, {})
  },
}

/**
 * Top-level route definitions for the NestedRouter.
 *
 * `/layout-tests` and its children render standalone (no PageLayout wrapper).
 * `/` wraps its children in the main app layout with AppBar + Sidebar navigation.
 */
export const appRoutes = {
  '/layout-tests': {
    component: ({ outlet }) => {
      return (
        outlet ?? (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { LayoutTestsIndex } = await import('./pages/layout-tests/index.js')
              return <LayoutTestsIndex />
            }}
          />
        )
      )
    },
    children: {
      '/appbar-only': {
        component: () => (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { AppBarOnlyTest } = await import('./pages/layout-tests/index.js')
              return <AppBarOnlyTest />
            }}
          />
        ),
      },
      '/appbar-left-drawer': {
        component: () => (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { AppBarLeftDrawerTest } = await import('./pages/layout-tests/index.js')
              return <AppBarLeftDrawerTest />
            }}
          />
        ),
      },
      '/appbar-right-drawer': {
        component: () => (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { AppBarRightDrawerTest } = await import('./pages/layout-tests/index.js')
              return <AppBarRightDrawerTest />
            }}
          />
        ),
      },
      '/appbar-both-drawers': {
        component: () => (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { AppBarBothDrawersTest } = await import('./pages/layout-tests/index.js')
              return <AppBarBothDrawersTest />
            }}
          />
        ),
      },
      '/collapsible-drawer': {
        component: () => (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { CollapsibleDrawerTest } = await import('./pages/layout-tests/index.js')
              return <CollapsibleDrawerTest />
            }}
          />
        ),
      },
      '/auto-hide-appbar': {
        component: () => (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { AutoHideAppBarTest } = await import('./pages/layout-tests/index.js')
              return <AutoHideAppBarTest />
            }}
          />
        ),
      },
      '/responsive-layout': {
        component: () => (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { ResponsiveLayoutTest } = await import('./pages/layout-tests/index.js')
              return <ResponsiveLayoutTest />
            }}
          />
        ),
      },
      '/temporary-drawer': {
        component: () => (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { TemporaryDrawerTest } = await import('./pages/layout-tests/index.js')
              return <TemporaryDrawerTest />
            }}
          />
        ),
      },
    },
  },
  '/': {
    component: ({ outlet }) => (
      <ShowcaseLayout>
        {outlet ?? (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { HomePage } = await import('./pages/home/index.js')
              return <HomePage />
            }}
          />
        )}
      </ShowcaseLayout>
    ),
    children: {
      '/inputs-and-forms': {
        component: ({ outlet }) => outlet ?? <Navigate to="/inputs-and-forms/buttons" />,
        children: {
          '/buttons': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { ButtonsPage } = await import('./pages/inputs-and-forms/buttons.js')
                  await sleepAsync(1000)
                  return <ButtonsPage />
                }}
              />
            ),
          },
          '/inputs': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { InputsPage } = await import('./pages/inputs-and-forms/inputs.js')
                  return <InputsPage />
                }}
              />
            ),
          },
          '/form': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  await sleepAsync(1000)
                  const { FormPage } = await import('./pages/inputs-and-forms/form.js')
                  return <FormPage />
                }}
              />
            ),
          },
        },
      },
      '/data-display': {
        component: ({ outlet }) => outlet ?? <Navigate to="/data-display/grid" />,
        children: {
          '/grid': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { GridPage } = await import('./pages/data-display/grid/index.js')
                  return <GridPage />
                }}
              />
            ),
          },
          '/list': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { ListPage } = await import('./pages/data-display/list.js')
                  return <ListPage />
                }}
              />
            ),
          },
          '/tree': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { TreePage } = await import('./pages/data-display/tree.js')
                  return <TreePage />
                }}
              />
            ),
          },
          '/avatar': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { AvatarPage } = await import('./pages/data-display/avatar.js')
                  return <AvatarPage />
                }}
              />
            ),
          },
          '/breadcrumb': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { BreadcrumbPage } = await import('./pages/data-display/breadcrumb.js')
                  return <BreadcrumbPage />
                }}
              />
            ),
          },
        },
      },
      '/navigation': {
        component: ({ outlet }) => outlet ?? <Navigate to="/navigation/tabs" />,
        children: {
          '/tabs': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { TabsPage } = await import('./pages/navigation/tabs.js')
                  return <TabsPage />
                }}
              />
            ),
          },
          '/context-menu': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { ContextMenuPage } = await import('./pages/navigation/context-menu.js')
                  return <ContextMenuPage />
                }}
              />
            ),
          },
          '/command-palette': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { CommandPalettePage } = await import('./pages/navigation/command-palette.js')
                  return <CommandPalettePage />
                }}
              />
            ),
          },
          '/suggest': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { SuggestPage } = await import('./pages/navigation/suggest.js')
                  return <SuggestPage />
                }}
              />
            ),
          },
        },
      },
      '/feedback': {
        component: ({ outlet }) => outlet ?? <Navigate to="/feedback/notifications" />,
        children: {
          '/notifications': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { NotysPage } = await import('./pages/feedback/notifications.js')
                  return <NotysPage />
                }}
              />
            ),
          },
        },
      },
      '/surfaces': {
        component: ({ outlet }) => outlet ?? <Navigate to="/surfaces/wizard" />,
        children: {
          '/wizard': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { WizardPage } = await import('./pages/surfaces/wizard/index.js')
                  return <WizardPage />
                }}
              />
            ),
          },
          '/fab': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { FabPage } = await import('./pages/surfaces/fab.js')
                  return <FabPage />
                }}
              />
            ),
          },
        },
      },
      '/integrations': {
        component: ({ outlet }) => outlet ?? <Navigate to="/integrations/monaco" />,
        children: {
          '/monaco': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { MonacoEditorPage } = await import('./pages/integrations/monaco.js')
                  return <MonacoEditorPage />
                }}
              />
            ),
          },
          '/lottie': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { LottiePage } = await import('./pages/integrations/lottie.js')
                  return <LottiePage />
                }}
              />
            ),
          },
          '/nipple': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { NipplePage } = await import('./pages/integrations/nipple.js')
                  return <NipplePage />
                }}
              />
            ),
          },
          '/mfe': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { MFEPage } = await import('./pages/integrations/mfe/mfe-page.js')
                  return <MFEPage />
                }}
              />
            ),
          },
          '/i18n': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { I18NPage } = await import('./pages/integrations/i18n/i18n.tsx')
                  return <I18NPage />
                }}
              />
            ),
          },
        },
      },
      '/utilities': {
        component: ({ outlet }) => outlet ?? <Navigate to="/utilities/search-state" />,
        children: {
          '/search-state': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { SearchStatePage } = await import('./pages/utilities/search-state.js')
                  return <SearchStatePage />
                }}
              />
            ),
          },
          '/stored-state': {
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { StoredStatePage } = await import('./pages/utilities/stored-state.js')
                  return <StoredStatePage />
                }}
              />
            ),
          },
        },
      },
    },
  },
} satisfies Record<string, NestedRoute<any>>
