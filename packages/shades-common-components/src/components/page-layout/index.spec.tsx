import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LayoutService } from '../../services/layout-service.js'
import { PageLayout, type AppBarConfig, type DrawerConfig } from './index.js'

describe('PageLayout component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  type RenderOptions = {
    appBar?: AppBarConfig
    drawer?: {
      left?: DrawerConfig
      right?: DrawerConfig
    }
    children?: JSX.Element
  }

  const renderPageLayout = async (options: RenderOptions = {}) => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <PageLayout appBar={options.appBar} drawer={options.drawer}>
          {options.children ?? <div>Content</div>}
        </PageLayout>
      ),
    })

    await sleepAsync(50)

    const pageLayout = document.querySelector('shade-page-layout') as HTMLElement & { injector: Injector }

    return {
      injector,
      pageLayout,
      layoutService: pageLayout.injector.getInstance(LayoutService),
    }
  }

  describe('rendering', () => {
    it('should render the shade-page-layout custom element', async () => {
      const { pageLayout } = await renderPageLayout()
      expect(pageLayout).not.toBeNull()
      expect(pageLayout.tagName.toLowerCase()).toBe('shade-page-layout')
    })

    it('should render children in content area', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout>
              <div id="test-content">Test Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('page-layout-content')
      })
    })
  })

  describe('positioning', () => {
    it('should have fixed positioning', async () => {
      const { pageLayout } = await renderPageLayout()
      const computedStyle = window.getComputedStyle(pageLayout)
      expect(computedStyle.position).toBe('fixed')
    })

    it('should have full width', async () => {
      const { pageLayout } = await renderPageLayout()
      const computedStyle = window.getComputedStyle(pageLayout)
      expect(computedStyle.width).toBe('100%')
    })

    it('should have full height', async () => {
      const { pageLayout } = await renderPageLayout()
      const computedStyle = window.getComputedStyle(pageLayout)
      expect(computedStyle.height).toBe('100%')
    })
  })

  describe('AppBar', () => {
    it('should render AppBar when configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              appBar={{
                variant: 'permanent',
                component: <div id="my-appbar">AppBar Content</div>,
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('page-layout-appbar')
        expect(document.body.innerHTML).toContain('my-appbar')
      })
    })

    it('should not render AppBar when not configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout>
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).not.toContain('page-layout-appbar')
      })
    })

    it('should use custom AppBar height', async () => {
      const { layoutService } = await renderPageLayout({
        appBar: {
          variant: 'permanent',
          height: '64px',
          component: <div>AppBar</div>,
        },
      })

      expect(layoutService.appBarHeight.getValue()).toBe('64px')
    })

    it('should use default AppBar height when not specified', async () => {
      const { layoutService } = await renderPageLayout({
        appBar: {
          variant: 'permanent',
          component: <div>AppBar</div>,
        },
      })

      expect(layoutService.appBarHeight.getValue()).toBe('48px')
    })

    it('should add appbar-auto-hide class to host for auto-hide variant', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              appBar={{
                variant: 'auto-hide',
                component: <div>AppBar</div>,
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        const pageLayout = document.querySelector('shade-page-layout')
        expect(pageLayout?.classList.contains('appbar-auto-hide')).toBe(true)
      })
    })

    it('should not add appbar-auto-hide class to host for permanent variant', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              appBar={{
                variant: 'permanent',
                component: <div>AppBar</div>,
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        const pageLayout = document.querySelector('shade-page-layout')
        expect(pageLayout?.classList.contains('appbar-auto-hide')).toBe(false)
      })
    })

    it('should add appbar-visible class to host when appBarVisible is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              appBar={{
                variant: 'auto-hide',
                component: <div>AppBar</div>,
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        // Initially visible (appBarVisible defaults to true)
        const pageLayout = document.querySelector('shade-page-layout')
        expect(pageLayout?.classList.contains('appbar-visible')).toBe(true)
      })
    })
  })

  describe('Left Drawer', () => {
    it('should render left drawer when configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              drawer={{
                left: {
                  variant: 'permanent',
                  component: <div id="left-drawer">Left Drawer</div>,
                },
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('page-layout-drawer-left')
        expect(document.body.innerHTML).toContain('left-drawer')
      })
    })

    it('should not render left drawer when not configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout>
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).not.toContain('page-layout-drawer-left')
      })
    })

    it('should initialize permanent drawer as open', async () => {
      const { layoutService } = await renderPageLayout({
        drawer: {
          left: {
            variant: 'permanent',
            component: <div>Left Drawer</div>,
          },
        },
      })

      expect(layoutService.drawerState.getValue().left?.open).toBe(true)
    })

    it('should initialize collapsible drawer as open by default', async () => {
      const { layoutService } = await renderPageLayout({
        drawer: {
          left: {
            variant: 'collapsible',
            component: <div>Left Drawer</div>,
          },
        },
      })

      expect(layoutService.drawerState.getValue().left?.open).toBe(true)
    })

    it('should initialize collapsible drawer as closed when defaultOpen is false', async () => {
      const { layoutService } = await renderPageLayout({
        drawer: {
          left: {
            variant: 'collapsible',
            defaultOpen: false,
            component: <div>Left Drawer</div>,
          },
        },
      })

      expect(layoutService.drawerState.getValue().left?.open).toBe(false)
    })

    it('should use custom drawer width', async () => {
      const { layoutService } = await renderPageLayout({
        drawer: {
          left: {
            variant: 'permanent',
            width: '300px',
            component: <div>Left Drawer</div>,
          },
        },
      })

      expect(layoutService.drawerState.getValue().left?.width).toBe('300px')
    })

    it('should use default drawer width when not specified', async () => {
      const { layoutService } = await renderPageLayout({
        drawer: {
          left: {
            variant: 'permanent',
            component: <div>Left Drawer</div>,
          },
        },
      })

      expect(layoutService.drawerState.getValue().left?.width).toBe('240px')
    })

    it('should add drawer-left-closed class to host when drawer is closed', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              drawer={{
                left: {
                  variant: 'collapsible',
                  defaultOpen: false,
                  component: <div>Left Drawer</div>,
                },
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        const pageLayout = document.querySelector('shade-page-layout')
        expect(pageLayout?.classList.contains('drawer-left-closed')).toBe(true)
      })
    })
  })

  describe('Right Drawer', () => {
    it('should render right drawer when configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              drawer={{
                right: {
                  variant: 'permanent',
                  component: <div id="right-drawer">Right Drawer</div>,
                },
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('page-layout-drawer-right')
        expect(document.body.innerHTML).toContain('right-drawer')
      })
    })

    it('should not render right drawer when not configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout>
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).not.toContain('page-layout-drawer-right')
      })
    })

    it('should initialize right drawer state correctly', async () => {
      const { layoutService } = await renderPageLayout({
        drawer: {
          right: {
            variant: 'permanent',
            width: '200px',
            component: <div>Right Drawer</div>,
          },
        },
      })

      expect(layoutService.drawerState.getValue().right).toEqual({
        open: true,
        width: '200px',
        variant: 'permanent',
      })
    })
  })

  describe('Both Drawers', () => {
    it('should render both drawers when configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              drawer={{
                left: {
                  variant: 'permanent',
                  component: <div id="left-drawer">Left Drawer</div>,
                },
                right: {
                  variant: 'permanent',
                  component: <div id="right-drawer">Right Drawer</div>,
                },
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('page-layout-drawer-left')
        expect(document.body.innerHTML).toContain('page-layout-drawer-right')
      })
    })

    it('should initialize both drawer states correctly', async () => {
      const { layoutService } = await renderPageLayout({
        drawer: {
          left: {
            variant: 'permanent',
            width: '240px',
            component: <div>Left Drawer</div>,
          },
          right: {
            variant: 'collapsible',
            width: '200px',
            defaultOpen: false,
            component: <div>Right Drawer</div>,
          },
        },
      })

      expect(layoutService.drawerState.getValue()).toEqual({
        left: { open: true, width: '240px', variant: 'permanent' },
        right: { open: false, width: '200px', variant: 'collapsible' },
      })
    })
  })

  describe('Temporary Drawer Backdrop', () => {
    it('should render backdrop element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              drawer={{
                left: {
                  variant: 'temporary',
                  component: <div>Temporary Drawer</div>,
                },
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('page-layout-drawer-backdrop')
      })
    })

    it('should add backdrop-visible class to host when temporary drawer is open', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              drawer={{
                left: {
                  variant: 'temporary',
                  defaultOpen: true,
                  component: <div>Temporary Drawer</div>,
                },
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        const pageLayout = document.querySelector('shade-page-layout')
        expect(pageLayout?.classList.contains('backdrop-visible')).toBe(true)
      })
    })

    it('should close temporary drawer when backdrop is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              drawer={{
                left: {
                  variant: 'temporary',
                  defaultOpen: true,
                  component: <div>Temporary Drawer</div>,
                },
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        const pageLayout = document.querySelector('shade-page-layout')
        expect(pageLayout?.classList.contains('drawer-left-closed')).toBe(false)

        const backdrop = document.querySelector('.page-layout-drawer-backdrop') as HTMLElement
        backdrop.click()
        await sleepAsync(50)

        expect(pageLayout?.classList.contains('drawer-left-closed')).toBe(true)
      })
    })
  })

  describe('Content Area', () => {
    it('should render content area', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout>
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('page-layout-content')
      })
    })

    it('should set CSS variable for zero paddingTop when no AppBar is configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout>
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        const pageLayout = document.querySelector('shade-page-layout') as HTMLElement
        // AppBar height is 0 when not configured, so contentPaddingTop = calc(0px + 0px)
        expect(pageLayout.style.getPropertyValue('--layout-appbar-height')).toBe('0px')
        expect(pageLayout.style.getPropertyValue('--layout-content-padding-top')).toBe('calc(0px + 0px)')
      })
    })

    it('should set CSS variable for paddingTop equal to AppBar height when AppBar is configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              appBar={{
                variant: 'permanent',
                component: <div>AppBar</div>,
                height: '64px',
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        const pageLayout = document.querySelector('shade-page-layout') as HTMLElement
        // Content padding top CSS variable should be calculated from appBarHeight + topGap
        expect(pageLayout.style.getPropertyValue('--layout-appbar-height')).toBe('64px')
        expect(pageLayout.style.getPropertyValue('--layout-content-padding-top')).toBe('calc(64px + 0px)')
      })
    })

    it('should set CSS variable for topGap when configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              appBar={{
                variant: 'permanent',
                component: <div>AppBar</div>,
                height: '48px',
              }}
              topGap="16px"
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        const pageLayout = document.querySelector('shade-page-layout') as HTMLElement
        expect(pageLayout.style.getPropertyValue('--layout-top-gap')).toBe('16px')
        expect(pageLayout.style.getPropertyValue('--layout-content-padding-top')).toBe('calc(48px + 16px)')
      })
    })

    it('should set CSS variable for sideGap when configured', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout sideGap="24px">
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)
        const pageLayout = document.querySelector('shade-page-layout') as HTMLElement
        expect(pageLayout.style.getPropertyValue('--layout-side-gap')).toBe('24px')
      })
    })
  })

  describe('LayoutService Integration', () => {
    it('should update AppBar height to 0 when no AppBar is configured', async () => {
      const { layoutService } = await renderPageLayout()

      expect(layoutService.appBarHeight.getValue()).toBe('0px')
    })

    it('should respond to drawer state changes from LayoutService', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              drawer={{
                left: {
                  variant: 'collapsible',
                  component: <div>Left Drawer</div>,
                },
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)

        const pageLayout = document.querySelector('shade-page-layout') as HTMLElement & { injector: Injector }
        const layoutService = pageLayout.injector.getInstance(LayoutService)

        // Initially open
        expect(pageLayout.classList.contains('drawer-left-closed')).toBe(false)

        // Close via LayoutService
        layoutService.setDrawerOpen('left', false)
        await sleepAsync(50)

        expect(pageLayout.classList.contains('drawer-left-closed')).toBe(true)
      })
    })

    it('should respond to appBarVisible changes for auto-hide variant', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              appBar={{
                variant: 'auto-hide',
                component: <div>AppBar</div>,
              }}
            >
              <div>Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)

        const pageLayout = document.querySelector('shade-page-layout') as HTMLElement & { injector: Injector }
        const layoutService = pageLayout.injector.getInstance(LayoutService)

        // Initially visible
        expect(pageLayout.classList.contains('appbar-visible')).toBe(true)

        // Hide via LayoutService
        layoutService.appBarVisible.setValue(false)
        await sleepAsync(50)

        expect(pageLayout.classList.contains('appbar-visible')).toBe(false)
      })
    })
  })

  describe('Full Layout', () => {
    it('should render complete layout with AppBar and both drawers', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageLayout
              appBar={{
                variant: 'permanent',
                height: '64px',
                component: <div id="appbar">AppBar</div>,
              }}
              drawer={{
                left: {
                  variant: 'collapsible',
                  width: '240px',
                  component: <div id="left-drawer">Left Sidebar</div>,
                },
                right: {
                  variant: 'permanent',
                  width: '200px',
                  component: <div id="right-drawer">Right Panel</div>,
                },
              }}
            >
              <div id="main-content">Main Content</div>
            </PageLayout>
          ),
        })

        await sleepAsync(50)

        expect(document.body.innerHTML).toContain('page-layout-appbar')
        expect(document.body.innerHTML).toContain('page-layout-drawer-left')
        expect(document.body.innerHTML).toContain('page-layout-drawer-right')
        expect(document.body.innerHTML).toContain('page-layout-content')

        const pageLayout = document.querySelector('shade-page-layout') as HTMLElement & { injector: Injector }
        const layoutService = pageLayout.injector.getInstance(LayoutService)

        expect(layoutService.appBarHeight.getValue()).toBe('64px')
        expect(layoutService.drawerState.getValue()).toEqual({
          left: { open: true, width: '240px', variant: 'collapsible' },
          right: { open: true, width: '200px', variant: 'permanent' },
        })
      })
    })
  })
})
