import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, ScreenService } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LayoutService } from '../../services/layout-service.js'
import { Drawer, type DrawerProps } from './index.js'

describe('Drawer component', () => {
  let mockSetProperty: ReturnType<typeof vi.fn>

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    mockSetProperty = vi.fn()

    // Mock document.documentElement.style.setProperty for LayoutService
    Object.defineProperty(document, 'documentElement', {
      value: {
        style: {
          setProperty: mockSetProperty,
        },
      },
      configurable: true,
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  type RenderOptions = Omit<DrawerProps, 'position' | 'variant'> & {
    position?: 'left' | 'right'
    variant?: 'permanent' | 'collapsible' | 'temporary'
    children?: JSX.Element
  }

  const renderDrawer = async (options: RenderOptions = {}) => {
    const { position = 'left', variant = 'collapsible', children = <div>Drawer Content</div>, ...restProps } = options

    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: (
        <Drawer position={position} variant={variant} {...restProps}>
          {children}
        </Drawer>
      ),
    })

    await sleepAsync(50)

    const drawer = document.querySelector('shade-drawer') as HTMLElement

    return {
      injector,
      drawer,
      layoutService: injector.getInstance(LayoutService),
      screenService: injector.getInstance(ScreenService),
    }
  }

  describe('rendering', () => {
    it('should render the shade-drawer custom element', async () => {
      const { drawer } = await renderDrawer()
      expect(drawer).not.toBeNull()
      expect(drawer.tagName.toLowerCase()).toBe('shade-drawer')
    })

    it('should render children in drawer content', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="collapsible">
              <div id="test-content">Test Content</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('test-content')
      })
    })

    it('should render left drawer with correct positioning class', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="permanent">
              <div>Left Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        const container = document.querySelector('.drawer-left')
        expect(container).not.toBeNull()
      })
    })

    it('should render right drawer with correct positioning class', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="right" variant="permanent">
              <div>Right Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        const container = document.querySelector('.drawer-right')
        expect(container).not.toBeNull()
      })
    })
  })

  describe('permanent variant', () => {
    it('should initialize as open', async () => {
      const { layoutService } = await renderDrawer({
        position: 'left',
        variant: 'permanent',
      })

      expect(layoutService.drawerState.getValue().left?.open).toBe(true)
    })

    it('should not have closed class when open', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="permanent">
              <div>Permanent Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        const container = document.querySelector('.drawer-container')
        expect(container?.classList.contains('closed')).toBe(false)
      })
    })

    it('should set data-variant attribute to permanent', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="permanent">
              <div>Permanent Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        const container = document.querySelector('.drawer-container')
        expect(container?.getAttribute('data-variant')).toBe('permanent')
      })
    })
  })

  describe('collapsible variant', () => {
    it('should initialize as open by default', async () => {
      const { layoutService } = await renderDrawer({
        position: 'left',
        variant: 'collapsible',
      })

      expect(layoutService.drawerState.getValue().left?.open).toBe(true)
    })

    it('should initialize as closed when defaultOpen is false', async () => {
      const { layoutService } = await renderDrawer({
        position: 'left',
        variant: 'collapsible',
        defaultOpen: false,
      })

      expect(layoutService.drawerState.getValue().left?.open).toBe(false)
    })

    it('should add closed class when drawer is closed', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="collapsible" defaultOpen={false}>
              <div>Collapsible Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        const container = document.querySelector('.drawer-container')
        expect(container?.classList.contains('closed')).toBe(true)
      })
    })

    it('should respond to LayoutService toggle', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="collapsible">
              <div>Collapsible Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)

        // Initially open
        let container = document.querySelector('.drawer-container')
        expect(container?.classList.contains('closed')).toBe(false)

        // Close via LayoutService
        layoutService.setDrawerOpen('left', false)
        await sleepAsync(50)

        container = document.querySelector('.drawer-container')
        expect(container?.classList.contains('closed')).toBe(true)
      })
    })
  })

  describe('temporary variant', () => {
    it('should initialize as closed by default', async () => {
      const { layoutService } = await renderDrawer({
        position: 'left',
        variant: 'temporary',
      })

      expect(layoutService.drawerState.getValue().left?.open).toBe(false)
    })

    it('should initialize as open when defaultOpen is true', async () => {
      const { layoutService } = await renderDrawer({
        position: 'left',
        variant: 'temporary',
        defaultOpen: true,
      })

      expect(layoutService.drawerState.getValue().left?.open).toBe(true)
    })

    it('should render backdrop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="temporary">
              <div>Temporary Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('drawer-backdrop')
      })
    })

    it('should show backdrop when drawer is open', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="temporary">
              <div>Temporary Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        layoutService.setDrawerOpen('left', true)
        await sleepAsync(50)

        const backdrop = document.querySelector('.drawer-backdrop')
        expect(backdrop?.classList.contains('visible')).toBe(true)
      })
    })

    it('should close drawer when backdrop is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="temporary">
              <div>Temporary Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        layoutService.setDrawerOpen('left', true)
        await sleepAsync(50)

        const backdrop = document.querySelector('.drawer-backdrop') as HTMLElement
        backdrop.click()
        await sleepAsync(50)

        expect(layoutService.drawerState.getValue().left?.open).toBe(false)
      })
    })

    it('should use transform for temporary drawer animation', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="temporary" width="300px">
              <div>Temporary Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)

        // When closed, left drawer should be translated off-screen
        let container = document.querySelector('.drawer-container') as HTMLElement
        expect(container.style.transform).toContain('translateX')
        expect(container.style.width).toBe('300px')

        // When opened
        layoutService.setDrawerOpen('left', true)
        await sleepAsync(50)

        container = document.querySelector('.drawer-container') as HTMLElement
        expect(container.style.transform).toBe('translateX(0)')
      })
    })
  })

  describe('width configuration', () => {
    it('should use custom width', async () => {
      const { layoutService } = await renderDrawer({
        position: 'left',
        variant: 'permanent',
        width: '300px',
      })

      expect(layoutService.drawerState.getValue().left?.width).toBe('300px')
    })

    it('should use default width of 240px when not specified', async () => {
      const { layoutService } = await renderDrawer({
        position: 'left',
        variant: 'permanent',
      })

      expect(layoutService.drawerState.getValue().left?.width).toBe('240px')
    })

    it('should update width in LayoutService when changed', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)

        // First render with width
        layoutService.initDrawer('left', { open: true, width: '200px', variant: 'collapsible' })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="permanent" width="300px">
              <div>Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)

        // Width should be updated to 300px
        expect(layoutService.drawerState.getValue().left?.width).toBe('300px')
      })
    })
  })

  describe('right drawer', () => {
    it('should initialize right drawer state correctly', async () => {
      const { layoutService } = await renderDrawer({
        position: 'right',
        variant: 'collapsible',
        width: '200px',
      })

      expect(layoutService.drawerState.getValue().right).toEqual({
        open: true,
        width: '200px',
        variant: 'collapsible',
      })
    })

    it('should render right drawer backdrop for temporary variant', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="right" variant="temporary">
              <div>Temporary Right Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        layoutService.setDrawerOpen('right', true)
        await sleepAsync(50)

        const backdrop = document.querySelector('[data-testid="drawer-backdrop-right"]')
        expect(backdrop).not.toBeNull()
      })
    })
  })

  describe('responsive breakpoint', () => {
    it('should close collapsible drawer when screen becomes smaller than breakpoint', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)
        const screenService = injector.getInstance(ScreenService)

        // Start with large screen
        screenService.screenSize.atLeast.md.setValue(true)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="collapsible" collapseOnBreakpoint="md">
              <div>Responsive Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)

        // Drawer should be open on large screen
        expect(layoutService.drawerState.getValue().left?.open).toBe(true)

        // Simulate screen becoming smaller
        screenService.screenSize.atLeast.md.setValue(false)
        await sleepAsync(50)

        // Drawer should now be closed
        expect(layoutService.drawerState.getValue().left?.open).toBe(false)
      })
    })

    it('should open collapsible drawer when screen becomes larger than breakpoint', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)
        const screenService = injector.getInstance(ScreenService)

        // Start with large screen
        screenService.screenSize.atLeast.md.setValue(true)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="collapsible" collapseOnBreakpoint="md">
              <div>Responsive Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)

        // Drawer should be open on large screen
        expect(layoutService.drawerState.getValue().left?.open).toBe(true)

        // Simulate screen becoming smaller
        screenService.screenSize.atLeast.md.setValue(false)
        await sleepAsync(50)

        // Drawer should now be closed
        expect(layoutService.drawerState.getValue().left?.open).toBe(false)

        // Simulate screen becoming larger again
        screenService.screenSize.atLeast.md.setValue(true)
        await sleepAsync(50)

        // Drawer should now be open again
        expect(layoutService.drawerState.getValue().left?.open).toBe(true)
      })
    })

    it('should close temporary drawer when screen becomes larger than breakpoint', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)
        const screenService = injector.getInstance(ScreenService)

        // Start with small screen and drawer open
        screenService.screenSize.atLeast.md.setValue(false)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="temporary" collapseOnBreakpoint="md" defaultOpen={true}>
              <div>Temporary Mobile Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        expect(layoutService.drawerState.getValue().left?.open).toBe(true)

        // Simulate screen becoming larger
        screenService.screenSize.atLeast.md.setValue(true)
        await sleepAsync(50)

        // Temporary drawer should close when screen is large (switch to desktop layout)
        expect(layoutService.drawerState.getValue().left?.open).toBe(false)
      })
    })

    it('should not affect permanent drawers with collapseOnBreakpoint', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)
        const screenService = injector.getInstance(ScreenService)

        // Start with large screen
        screenService.screenSize.atLeast.md.setValue(true)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="permanent" collapseOnBreakpoint="md">
              <div>Permanent Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        expect(layoutService.drawerState.getValue().left?.open).toBe(true)

        // Simulate screen becoming smaller
        screenService.screenSize.atLeast.md.setValue(false)
        await sleepAsync(50)

        // Permanent drawer should remain open
        expect(layoutService.drawerState.getValue().left?.open).toBe(true)
      })
    })
  })

  describe('data attributes', () => {
    it('should set data-variant attribute', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="collapsible">
              <div>Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        const container = document.querySelector('.drawer-container')
        expect(container?.getAttribute('data-variant')).toBe('collapsible')
      })
    })

    it('should set data-open attribute', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="collapsible">
              <div>Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        let container = document.querySelector('.drawer-container')
        expect(container?.getAttribute('data-open')).toBe('true')

        layoutService.setDrawerOpen('left', false)
        await sleepAsync(50)

        container = document.querySelector('.drawer-container')
        expect(container?.getAttribute('data-open')).toBe('false')
      })
    })

    it('should set data-testid attribute', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="collapsible">
              <div>Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)
        const container = document.querySelector('[data-testid="drawer-left"]')
        expect(container).not.toBeNull()
      })
    })
  })

  describe('preserving user interactions', () => {
    it('should not reset drawer state if already initialized', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const layoutService = injector.getInstance(LayoutService)

        // Pre-initialize drawer as closed
        layoutService.initDrawer('left', { open: false, width: '240px', variant: 'collapsible' })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Drawer position="left" variant="collapsible" defaultOpen={true}>
              <div>Drawer</div>
            </Drawer>
          ),
        })

        await sleepAsync(50)

        // Should preserve the closed state, not reset to defaultOpen
        expect(layoutService.drawerState.getValue().left?.open).toBe(false)
      })
    })
  })
})
