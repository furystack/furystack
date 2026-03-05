import type { NestedRoute } from '@furystack/shades'
import { createComponent, LazyLoad } from '@furystack/shades'
import { icons } from '@furystack/shades-common-components'
import { sleepAsync } from '@furystack/utils'

import './route-meta-augmentation.js'
import { Navigate } from './components/navigate.js'
import { PageLoader } from './components/page-loader.js'
import { ShowcaseLayout } from './components/showcase-layout.js'

/**
 * Top-level route definitions for the NestedRouter.
 *
 * `/layout-tests` and its children render standalone (no PageLayout wrapper).
 * `/` wraps its children in the main app layout with AppBar + Sidebar navigation.
 */
export const appRoutes = {
  '/layout-tests': {
    meta: { title: 'Layout Tests', icon: icons.ruler },
    component: ({ outlet }) => {
      return (
        outlet ?? (
          <LazyLoad
            viewTransition
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
        meta: { title: 'AppBar Only' },
        component: () => (
          <LazyLoad
            viewTransition
            loader={<PageLoader />}
            component={async () => {
              const { AppBarOnlyTest } = await import('./pages/layout-tests/index.js')
              return <AppBarOnlyTest />
            }}
          />
        ),
      },
      '/appbar-left-drawer': {
        meta: { title: 'AppBar + Left Drawer' },
        component: () => (
          <LazyLoad
            viewTransition
            loader={<PageLoader />}
            component={async () => {
              const { AppBarLeftDrawerTest } = await import('./pages/layout-tests/index.js')
              return <AppBarLeftDrawerTest />
            }}
          />
        ),
      },
      '/appbar-right-drawer': {
        meta: { title: 'AppBar + Right Drawer' },
        component: () => (
          <LazyLoad
            viewTransition
            loader={<PageLoader />}
            component={async () => {
              const { AppBarRightDrawerTest } = await import('./pages/layout-tests/index.js')
              return <AppBarRightDrawerTest />
            }}
          />
        ),
      },
      '/appbar-both-drawers': {
        meta: { title: 'AppBar + Both Drawers' },
        component: () => (
          <LazyLoad
            viewTransition
            loader={<PageLoader />}
            component={async () => {
              const { AppBarBothDrawersTest } = await import('./pages/layout-tests/index.js')
              return <AppBarBothDrawersTest />
            }}
          />
        ),
      },
      '/collapsible-drawer': {
        meta: { title: 'Collapsible Drawer' },
        component: () => (
          <LazyLoad
            viewTransition
            loader={<PageLoader />}
            component={async () => {
              const { CollapsibleDrawerTest } = await import('./pages/layout-tests/index.js')
              return <CollapsibleDrawerTest />
            }}
          />
        ),
      },
      '/auto-hide-appbar': {
        meta: { title: 'Auto-hide AppBar' },
        component: () => (
          <LazyLoad
            viewTransition
            loader={<PageLoader />}
            component={async () => {
              const { AutoHideAppBarTest } = await import('./pages/layout-tests/index.js')
              return <AutoHideAppBarTest />
            }}
          />
        ),
      },
      '/responsive-layout': {
        meta: { title: 'Responsive Layout' },
        component: () => (
          <LazyLoad
            viewTransition
            loader={<PageLoader />}
            component={async () => {
              const { ResponsiveLayoutTest } = await import('./pages/layout-tests/index.js')
              return <ResponsiveLayoutTest />
            }}
          />
        ),
      },
      '/temporary-drawer': {
        meta: { title: 'Temporary Drawer' },
        component: () => (
          <LazyLoad
            viewTransition
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
    meta: { title: 'Home' },
    component: ({ outlet }) => (
      <ShowcaseLayout>
        {outlet ?? (
          <LazyLoad
            viewTransition
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
        meta: { title: 'Inputs & Forms', icon: icons.fileText },
        component: ({ outlet }) => outlet ?? <Navigate to="/inputs-and-forms/buttons" />,
        children: {
          '/buttons': {
            meta: { title: 'Buttons' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { ButtonsPage } = await import('./pages/inputs-and-forms/buttons.js')
                  await sleepAsync(1000)
                  return <ButtonsPage />
                }}
              />
            ),
          },
          '/button-group': {
            meta: { title: 'Button Group' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { ButtonGroupPage } = await import('./pages/inputs-and-forms/button-group.js')
                  return <ButtonGroupPage />
                }}
              />
            ),
          },
          '/checkboxes': {
            meta: { title: 'Checkboxes' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { CheckboxesPage } = await import('./pages/inputs-and-forms/checkboxes.js')
                  return <CheckboxesPage />
                }}
              />
            ),
          },
          '/input-number': {
            meta: { title: 'Input Number' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { InputNumberPage } = await import('./pages/inputs-and-forms/input-number.js')
                  return <InputNumberPage />
                }}
              />
            ),
          },
          '/inputs': {
            meta: { title: 'Inputs' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { InputsPage } = await import('./pages/inputs-and-forms/inputs.js')
                  return <InputsPage />
                }}
              />
            ),
          },
          '/radio': {
            meta: { title: 'Radio' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { RadioPage } = await import('./pages/inputs-and-forms/radio.js')
                  return <RadioPage />
                }}
              />
            ),
          },
          '/rating': {
            meta: { title: 'Rating' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { RatingPage } = await import('./pages/inputs-and-forms/rating.js')
                  return <RatingPage />
                }}
              />
            ),
          },
          '/select': {
            meta: { title: 'Select' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { SelectPage } = await import('./pages/inputs-and-forms/select.js')
                  return <SelectPage />
                }}
              />
            ),
          },
          '/slider': {
            meta: { title: 'Slider' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { SliderPage } = await import('./pages/inputs-and-forms/slider.js')
                  return <SliderPage />
                }}
              />
            ),
          },
          '/switch': {
            meta: { title: 'Switch' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { SwitchPage } = await import('./pages/inputs-and-forms/switch.js')
                  return <SwitchPage />
                }}
              />
            ),
          },
          '/form': {
            meta: { title: 'Form' },

            component: () => (
              <LazyLoad
                viewTransition
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
        meta: { title: 'Data Display', icon: icons.barChart },
        component: ({ outlet }) => outlet ?? <Navigate to="/data-display/grid" />,
        children: {
          '/accordion': {
            meta: { title: 'Accordion' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { AccordionPage } = await import('./pages/data-display/accordion.js')
                  return <AccordionPage />
                }}
              />
            ),
          },
          '/grid': {
            meta: { title: 'Grid' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { GridPage } = await import('./pages/data-display/grid/index.js')
                  return <GridPage />
                }}
              />
            ),
          },
          '/list': {
            meta: { title: 'List' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { ListPage } = await import('./pages/data-display/list.js')
                  return <ListPage />
                }}
              />
            ),
          },
          '/tree': {
            meta: { title: 'Tree' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { TreePage } = await import('./pages/data-display/tree.js')
                  return <TreePage />
                }}
              />
            ),
          },
          '/avatar': {
            meta: { title: 'Avatar' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { AvatarPage } = await import('./pages/data-display/avatar.js')
                  return <AvatarPage />
                }}
              />
            ),
          },
          '/badge': {
            meta: { title: 'Badge' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { BadgePage } = await import('./pages/data-display/badge.js')
                  return <BadgePage />
                }}
              />
            ),
          },
          '/breadcrumb': {
            meta: { title: 'Breadcrumb' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { BreadcrumbPage } = await import('./pages/data-display/breadcrumb.js')
                  return <BreadcrumbPage />
                }}
              />
            ),
          },
          '/carousel': {
            meta: { title: 'Carousel' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { CarouselPage } = await import('./pages/data-display/carousel.js')
                  return <CarouselPage />
                }}
              />
            ),
          },
          '/chip': {
            meta: { title: 'Chip' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { ChipPage } = await import('./pages/data-display/chip.js')
                  return <ChipPage />
                }}
              />
            ),
          },
          '/icons': {
            meta: { title: 'Icons' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { IconsPage } = await import('./pages/data-display/icons.js')
                  return <IconsPage />
                }}
              />
            ),
          },
          '/image': {
            meta: { title: 'Image' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { ImagePage } = await import('./pages/data-display/image.js')
                  return <ImagePage />
                }}
              />
            ),
          },
          '/timeline': {
            meta: { title: 'Timeline' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { TimelinePage } = await import('./pages/data-display/timeline.js')
                  return <TimelinePage />
                }}
              />
            ),
          },
          '/tooltip': {
            meta: { title: 'Tooltip' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { TooltipPage } = await import('./pages/data-display/tooltip.js')
                  return <TooltipPage />
                }}
              />
            ),
          },
          '/typography': {
            meta: { title: 'Typography' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { TypographyPage } = await import('./pages/data-display/typography.js')
                  return <TypographyPage />
                }}
              />
            ),
          },
          '/cache-view': {
            meta: { title: 'Cache View' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { CacheViewPage } = await import('./pages/data-display/cache-view.js')
                  return <CacheViewPage />
                }}
              />
            ),
          },
        },
      },
      '/navigation': {
        meta: { title: 'Navigation', icon: icons.compass },
        component: ({ outlet }) => outlet ?? <Navigate to="/navigation/tabs" />,
        children: {
          '/tabs': {
            meta: { title: 'Tabs' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { TabsPage } = await import('./pages/navigation/tabs.js')
                  return <TabsPage />
                }}
              />
            ),
          },
          '/menu': {
            meta: { title: 'Menu' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { MenuPage } = await import('./pages/navigation/menu.js')
                  return <MenuPage />
                }}
              />
            ),
          },
          '/dropdown': {
            meta: { title: 'Dropdown' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { DropdownPage } = await import('./pages/navigation/dropdown.js')
                  return <DropdownPage />
                }}
              />
            ),
          },
          '/context-menu': {
            meta: { title: 'Context Menu' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { ContextMenuPage } = await import('./pages/navigation/context-menu.js')
                  return <ContextMenuPage />
                }}
              />
            ),
          },
          '/command-palette': {
            meta: { title: 'Command Palette' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { CommandPalettePage } = await import('./pages/navigation/command-palette.js')
                  return <CommandPalettePage />
                }}
              />
            ),
          },
          '/suggest': {
            meta: { title: 'Suggest' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { SuggestPage } = await import('./pages/navigation/suggest.js')
                  return <SuggestPage />
                }}
              />
            ),
          },
          '/pagination': {
            meta: { title: 'Pagination' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { PaginationPage } = await import('./pages/navigation/pagination.js')
                  return <PaginationPage />
                }}
              />
            ),
          },
          '/view-transitions': {
            meta: { title: 'View Transitions' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { ViewTransitionsPage } = await import('./pages/navigation/view-transitions.js')
                  return <ViewTransitionsPage />
                }}
              />
            ),
          },
        },
      },
      '/feedback': {
        meta: { title: 'Feedback', icon: icons.bell },
        component: ({ outlet }) => outlet ?? <Navigate to="/feedback/alert" />,
        children: {
          '/alert': {
            meta: { title: 'Alert' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { AlertPage } = await import('./pages/feedback/alert.js')
                  return <AlertPage />
                }}
              />
            ),
          },
          '/notifications': {
            meta: { title: 'Notifications' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { NotysPage } = await import('./pages/feedback/notifications.js')
                  return <NotysPage />
                }}
              />
            ),
          },
          '/progress': {
            meta: { title: 'Progress' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { ProgressPage } = await import('./pages/feedback/progress.js')
                  return <ProgressPage />
                }}
              />
            ),
          },
          '/result': {
            meta: { title: 'Result' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { ResultPage } = await import('./pages/feedback/result.js')
                  return <ResultPage />
                }}
              />
            ),
          },
        },
      },
      '/layout': {
        meta: { title: 'Layout', icon: icons.ruler },
        component: ({ outlet }) => outlet ?? <Navigate to="/layout/divider" />,
        children: {
          '/divider': {
            meta: { title: 'Divider' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { DividerPage } = await import('./pages/layout/divider.js')
                  return <DividerPage />
                }}
              />
            ),
          },
        },
      },
      '/surfaces': {
        meta: { title: 'Surfaces', icon: icons.appWindow },
        component: ({ outlet }) => outlet ?? <Navigate to="/surfaces/card" />,
        children: {
          '/card': {
            meta: { title: 'Card' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { CardPage } = await import('./pages/surfaces/card.js')
                  return <CardPage />
                }}
              />
            ),
          },
          '/wizard': {
            meta: { title: 'Wizard' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { WizardPage } = await import('./pages/surfaces/wizard/index.js')
                  return <WizardPage />
                }}
              />
            ),
          },
          '/dialog': {
            meta: { title: 'Dialog' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { DialogPage } = await import('./pages/surfaces/dialog.js')
                  return <DialogPage />
                }}
              />
            ),
          },
          '/fab': {
            meta: { title: 'FAB' },

            component: () => (
              <LazyLoad
                viewTransition
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
        meta: { title: 'Integrations', icon: icons.plug },
        component: ({ outlet }) => outlet ?? <Navigate to="/integrations/monaco" />,
        children: {
          '/monaco': {
            meta: { title: 'Monaco' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { MonacoEditorPage } = await import('./pages/integrations/monaco.js')
                  return <MonacoEditorPage />
                }}
              />
            ),
          },
          '/lottie': {
            meta: { title: 'Lottie' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { LottiePage } = await import('./pages/integrations/lottie.js')
                  return <LottiePage />
                }}
              />
            ),
          },
          '/nipple': {
            meta: { title: 'Nipple' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { NipplePage } = await import('./pages/integrations/nipple.js')
                  return <NipplePage />
                }}
              />
            ),
          },
          '/mfe': {
            meta: { title: 'MFE' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { MFEPage } = await import('./pages/integrations/mfe/mfe-page.js')
                  return <MFEPage />
                }}
              />
            ),
          },
          '/i18n': {
            meta: { title: 'I18N' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { I18NPage } = await import('./pages/integrations/i18n/i18n.tsx')
                  return <I18NPage />
                }}
              />
            ),
          },
          '/markdown': {
            meta: { title: 'Markdown' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { MarkdownPage } = await import('./pages/integrations/markdown.js')
                  return <MarkdownPage />
                }}
              />
            ),
          },
        },
      },
      '/utilities': {
        meta: { title: 'Utilities', icon: icons.wrench },
        component: ({ outlet }) => outlet ?? <Navigate to="/utilities/search-state" />,
        children: {
          '/search-state': {
            meta: { title: 'Search State' },

            component: () => (
              <LazyLoad
                viewTransition
                loader={<PageLoader />}
                component={async () => {
                  const { SearchStatePage } = await import('./pages/utilities/search-state.js')
                  return <SearchStatePage />
                }}
              />
            ),
          },
          '/stored-state': {
            meta: { title: 'Stored State' },

            component: () => (
              <LazyLoad
                viewTransition
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
      '/themes': {
        meta: { title: 'Themes', icon: icons.sun },
        component: () => (
          <LazyLoad
            viewTransition
            loader={<PageLoader />}
            component={async () => {
              const { ThemesPage } = await import('./pages/themes.js')
              return <ThemesPage />
            }}
          />
        ),
      },
    },
  },
} satisfies Record<string, NestedRoute<any>>
