import type { NestedRoute } from '@furystack/shades'
import { createComponent, LazyLoad } from '@furystack/shades'
import { sleepAsync } from '@furystack/utils'

import { Navigate } from './components/navigate.js'
import { PageLoader } from './components/page-loader.js'
import { ShowcaseLayout } from './components/showcase-layout.js'

const withFadeTransition = {
  /*
  !!!TODO!!!
  onVisit: async (options: RenderOptions<unknown>) => {
    // await fadeIn(options, {})
  },
  onLeave: async (options: RenderOptions<unknown>) => {
    // await fadeOut(options, {})
  },*/
}

/**
 * Top-level route definitions for the NestedRouter.
 *
 * `/layout-tests` and its children render standalone (no PageLayout wrapper).
 * `/` wraps its children in the main app layout with AppBar + Sidebar navigation.
 */
export const appRoutes = {
  '/layout-tests': {
    meta: { title: 'Layout Tests' },
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
        meta: { title: 'AppBar Only' },
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
        meta: { title: 'AppBar + Left Drawer' },
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
        meta: { title: 'AppBar + Right Drawer' },
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
        meta: { title: 'AppBar + Both Drawers' },
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
        meta: { title: 'Collapsible Drawer' },
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
        meta: { title: 'Auto-hide AppBar' },
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
        meta: { title: 'Responsive Layout' },
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
        meta: { title: 'Temporary Drawer' },
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
    meta: { title: 'Home' },
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
        meta: { title: 'Inputs & Forms' },
        component: ({ outlet }) => outlet ?? <Navigate to="/inputs-and-forms/buttons" />,
        children: {
          '/buttons': {
            meta: { title: 'Buttons' },
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
          '/button-group': {
            meta: { title: 'Button Group' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
          '/radio': {
            meta: { title: 'Radio' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
        meta: { title: 'Data Display' },
        component: ({ outlet }) => outlet ?? <Navigate to="/data-display/grid" />,
        children: {
          '/accordion': {
            meta: { title: 'Accordion' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            meta: { title: 'List' },
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
            meta: { title: 'Tree' },
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
            meta: { title: 'Avatar' },
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
          '/badge': {
            meta: { title: 'Badge' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
          '/carousel': {
            meta: { title: 'Carousel' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
        meta: { title: 'Navigation' },
        component: ({ outlet }) => outlet ?? <Navigate to="/navigation/tabs" />,
        children: {
          '/tabs': {
            meta: { title: 'Tabs' },
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
          '/menu': {
            meta: { title: 'Menu' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            meta: { title: 'Command Palette' },
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
            meta: { title: 'Suggest' },
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
          '/pagination': {
            meta: { title: 'Pagination' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
                loader={<PageLoader />}
                component={async () => {
                  const { PaginationPage } = await import('./pages/navigation/pagination.js')
                  return <PaginationPage />
                }}
              />
            ),
          },
        },
      },
      '/feedback': {
        meta: { title: 'Feedback' },
        component: ({ outlet }) => outlet ?? <Navigate to="/feedback/alert" />,
        children: {
          '/alert': {
            meta: { title: 'Alert' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
          '/progress': {
            meta: { title: 'Progress' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
        meta: { title: 'Layout' },
        component: ({ outlet }) => outlet ?? <Navigate to="/layout/divider" />,
        children: {
          '/divider': {
            meta: { title: 'Divider' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
        meta: { title: 'Surfaces' },
        component: ({ outlet }) => outlet ?? <Navigate to="/surfaces/card" />,
        children: {
          '/card': {
            meta: { title: 'Card' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
          '/dialog': {
            meta: { title: 'Dialog' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
        meta: { title: 'Integrations' },
        component: ({ outlet }) => outlet ?? <Navigate to="/integrations/monaco" />,
        children: {
          '/monaco': {
            meta: { title: 'Monaco' },
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
            meta: { title: 'Lottie' },
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
            meta: { title: 'Nipple' },
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
            meta: { title: 'MFE' },
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
            meta: { title: 'I18N' },
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
          '/markdown': {
            meta: { title: 'Markdown' },
            ...withFadeTransition,
            component: () => (
              <LazyLoad
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
        meta: { title: 'Utilities' },
        component: ({ outlet }) => outlet ?? <Navigate to="/utilities/search-state" />,
        children: {
          '/search-state': {
            meta: { title: 'Search State' },
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
            meta: { title: 'Stored State' },
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
      '/themes': {
        meta: { title: 'Themes' },
        ...withFadeTransition,
        component: () => (
          <LazyLoad
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
