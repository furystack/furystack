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
          '/button-group': {
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
          '/accordion': {
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
          '/badge': {
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
          '/menu': {
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
          '/pagination': {
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
        component: ({ outlet }) => outlet ?? <Navigate to="/feedback/alert" />,
        children: {
          '/alert': {
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
        component: ({ outlet }) => outlet ?? <Navigate to="/layout/divider" />,
        children: {
          '/divider': {
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
        component: ({ outlet }) => outlet ?? <Navigate to="/surfaces/card" />,
        children: {
          '/card': {
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
