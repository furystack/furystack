import type { NestedRoute } from '@furystack/shades'
import { createComponent, LazyLoad } from '@furystack/shades'
import { fadeIn, fadeOut } from '@furystack/shades-common-components'
import { sleepAsync } from '@furystack/utils'

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
 * `/` wraps its children in the main app layout with AppBar navigation.
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
      '/buttons': {
        ...withFadeTransition,
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
      '/form': {
        ...withFadeTransition,
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
      '/inputs': {
        ...withFadeTransition,
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
      '/grid': {
        ...withFadeTransition,
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
      '/nipple': {
        ...withFadeTransition,
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
      '/lottie': {
        ...withFadeTransition,
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
      '/monaco': {
        ...withFadeTransition,
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
      '/wizard': {
        ...withFadeTransition,
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
      '/notys': {
        ...withFadeTransition,
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
      '/tabs': {
        ...withFadeTransition,
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
      '/i18n': {
        ...withFadeTransition,
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
      '/mfe': {
        ...withFadeTransition,
        component: () => (
          <LazyLoad
            loader={<PageLoader />}
            component={async () => {
              const { MFEPage } = await import('./pages/mfe/mfe-page.js')
              return <MFEPage />
            }}
          />
        ),
      },
      '/misc': {
        ...withFadeTransition,
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
    },
  },
} satisfies Record<string, NestedRoute<any>>
