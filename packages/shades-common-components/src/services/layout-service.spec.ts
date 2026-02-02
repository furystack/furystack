import { using } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LAYOUT_CSS_VARIABLES, LayoutService } from './layout-service.js'

describe('LayoutService', () => {
  let mockSetProperty: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockSetProperty = vi.fn()

    // Mock document.documentElement.style.setProperty
    vi.stubGlobal('document', {
      documentElement: {
        style: {
          setProperty: mockSetProperty,
        },
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      using(new LayoutService(), (service) => {
        expect(service.drawerState.getValue()).toEqual({})
        expect(service.appBarVisible.getValue()).toBe(true)
        expect(service.appBarHeight.getValue()).toBe('48px')
        expect(service.topGap.getValue()).toBe('0px')
        expect(service.sideGap.getValue()).toBe('0px')
      })
    })

    it('should update CSS variables on initialization', () => {
      using(new LayoutService(), () => {
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-appbar-height', '48px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-top-gap', '0px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-side-gap', '0px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-padding-top', 'calc(48px + 0px)')
        expect(mockSetProperty).toHaveBeenCalledWith(
          '--layout-content-available-height',
          'calc(100% - var(--layout-content-padding-top))',
        )
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-top', '48px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-left-width', '0px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-right-width', '0px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-left-configured-width', '0px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-right-configured-width', '0px')
      })
    })
  })

  describe('Drawer State Management', () => {
    describe('toggleDrawer', () => {
      it('should toggle drawer from closed to open', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: false, width: '240px', variant: 'collapsible' })

          service.toggleDrawer('left')

          expect(service.drawerState.getValue().left?.open).toBe(true)
        })
      })

      it('should toggle drawer from open to closed', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px', variant: 'collapsible' })

          service.toggleDrawer('left')

          expect(service.drawerState.getValue().left?.open).toBe(false)
        })
      })

      it('should do nothing if drawer is not initialized', () => {
        using(new LayoutService(), (service) => {
          service.toggleDrawer('left')

          expect(service.drawerState.getValue().left).toBeUndefined()
        })
      })

      it('should toggle right drawer independently', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px', variant: 'collapsible' })
          service.initDrawer('right', { open: false, width: '200px', variant: 'temporary' })

          service.toggleDrawer('right')

          expect(service.drawerState.getValue().left?.open).toBe(true)
          expect(service.drawerState.getValue().right?.open).toBe(true)
        })
      })
    })

    describe('setDrawerOpen', () => {
      it('should set drawer open state', () => {
        using(new LayoutService(), (service) => {
          service.setDrawerOpen('left', true)

          expect(service.drawerState.getValue().left?.open).toBe(true)
        })
      })

      it('should create drawer entry with default width if not exists', () => {
        using(new LayoutService(), (service) => {
          service.setDrawerOpen('left', true)

          expect(service.drawerState.getValue().left?.width).toBe('240px')
        })
      })

      it('should create drawer entry with default variant if not exists', () => {
        using(new LayoutService(), (service) => {
          service.setDrawerOpen('left', true)

          expect(service.drawerState.getValue().left?.variant).toBe('collapsible')
        })
      })

      it('should preserve existing width when setting open state', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: false, width: '300px', variant: 'collapsible' })

          service.setDrawerOpen('left', true)

          expect(service.drawerState.getValue().left?.width).toBe('300px')
        })
      })

      it('should preserve existing variant when setting open state', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: false, width: '240px', variant: 'temporary' })

          service.setDrawerOpen('left', true)

          expect(service.drawerState.getValue().left?.variant).toBe('temporary')
        })
      })
    })

    describe('setDrawerWidth', () => {
      it('should set drawer width', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px', variant: 'collapsible' })

          service.setDrawerWidth('left', '300px')

          expect(service.drawerState.getValue().left?.width).toBe('300px')
        })
      })

      it('should create drawer entry with default closed state if not exists', () => {
        using(new LayoutService(), (service) => {
          service.setDrawerWidth('left', '300px')

          expect(service.drawerState.getValue().left?.open).toBe(false)
        })
      })

      it('should create drawer entry with default variant if not exists', () => {
        using(new LayoutService(), (service) => {
          service.setDrawerWidth('left', '300px')

          expect(service.drawerState.getValue().left?.variant).toBe('collapsible')
        })
      })

      it('should preserve open state when setting width', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px', variant: 'collapsible' })

          service.setDrawerWidth('left', '300px')

          expect(service.drawerState.getValue().left?.open).toBe(true)
        })
      })

      it('should preserve variant when setting width', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px', variant: 'permanent' })

          service.setDrawerWidth('left', '300px')

          expect(service.drawerState.getValue().left?.variant).toBe('permanent')
        })
      })
    })

    describe('initDrawer', () => {
      it('should initialize left drawer', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '250px', variant: 'collapsible' })

          expect(service.drawerState.getValue().left).toEqual({ open: true, width: '250px', variant: 'collapsible' })
        })
      })

      it('should initialize right drawer', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('right', { open: false, width: '200px', variant: 'temporary' })

          expect(service.drawerState.getValue().right).toEqual({ open: false, width: '200px', variant: 'temporary' })
        })
      })

      it('should initialize both drawers', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px', variant: 'permanent' })
          service.initDrawer('right', { open: true, width: '200px', variant: 'temporary' })

          expect(service.drawerState.getValue()).toEqual({
            left: { open: true, width: '240px', variant: 'permanent' },
            right: { open: true, width: '200px', variant: 'temporary' },
          })
        })
      })

      it('should initialize drawer with all variant types', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px', variant: 'permanent' })
          expect(service.drawerState.getValue().left?.variant).toBe('permanent')

          service.initDrawer('left', { open: true, width: '240px', variant: 'collapsible' })
          expect(service.drawerState.getValue().left?.variant).toBe('collapsible')

          service.initDrawer('left', { open: true, width: '240px', variant: 'temporary' })
          expect(service.drawerState.getValue().left?.variant).toBe('temporary')
        })
      })
    })
  })

  describe('CSS Variables', () => {
    it('should update CSS variables when drawer opens', () => {
      using(new LayoutService(), (service) => {
        mockSetProperty.mockClear()

        service.initDrawer('left', { open: true, width: '240px', variant: 'collapsible' })

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-left-width', '240px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-left-configured-width', '240px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-left', '240px')
      })
    })

    it('should set drawer width to 0 when closed', () => {
      using(new LayoutService(), (service) => {
        service.initDrawer('left', { open: true, width: '240px', variant: 'collapsible' })
        mockSetProperty.mockClear()

        service.setDrawerOpen('left', false)

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-left-width', '0px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-left', '0px')
      })
    })

    it('should update CSS variables when AppBar height changes', () => {
      using(new LayoutService(), (service) => {
        mockSetProperty.mockClear()

        service.appBarHeight.setValue('64px')

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-appbar-height', '64px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-top', '64px')
      })
    })

    it('should update right drawer CSS variables', () => {
      using(new LayoutService(), (service) => {
        mockSetProperty.mockClear()

        service.initDrawer('right', { open: true, width: '200px', variant: 'collapsible' })

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-right-width', '200px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-right-configured-width', '200px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-right', '200px')
      })
    })

    it('should set content margin to 0 for temporary drawer variant', () => {
      using(new LayoutService(), (service) => {
        mockSetProperty.mockClear()

        service.initDrawer('right', { open: true, width: '200px', variant: 'temporary' })

        // Drawer width is set to 200px (it's open)
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-right-width', '200px')
        // Configured width is always set
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-right-configured-width', '200px')
        // But content margin is 0 because temporary drawers overlay content
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-right', '0px')
      })
    })

    it('should always set content margin to drawer width for permanent drawer variant', () => {
      using(new LayoutService(), (service) => {
        // Test when closed
        service.initDrawer('left', { open: false, width: '240px', variant: 'permanent' })
        mockSetProperty.mockClear()

        // Even when closed, permanent drawers push content
        service.setDrawerOpen('left', false)

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-left', '240px')
      })
    })

    it('should set content margin to 0 when collapsible drawer is closed', () => {
      using(new LayoutService(), (service) => {
        service.initDrawer('left', { open: true, width: '240px', variant: 'collapsible' })
        mockSetProperty.mockClear()

        service.setDrawerOpen('left', false)

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-left-width', '0px')
        // Configured width is still set
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-left-configured-width', '240px')
        // Content margin is 0 because drawer is closed
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-left', '0px')
      })
    })

    it('should update CSS variables when topGap changes', () => {
      using(new LayoutService(), (service) => {
        mockSetProperty.mockClear()

        service.setTopGap('16px')

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-top-gap', '16px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-padding-top', 'calc(48px + 16px)')
      })
    })

    it('should update CSS variables when sideGap changes', () => {
      using(new LayoutService(), (service) => {
        mockSetProperty.mockClear()

        service.setSideGap('24px')

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-side-gap', '24px')
      })
    })
  })

  describe('LAYOUT_CSS_VARIABLES export', () => {
    it('should export all CSS variable names', () => {
      expect(LAYOUT_CSS_VARIABLES.appBarHeight).toBe('--layout-appbar-height')
      expect(LAYOUT_CSS_VARIABLES.topGap).toBe('--layout-top-gap')
      expect(LAYOUT_CSS_VARIABLES.sideGap).toBe('--layout-side-gap')
      expect(LAYOUT_CSS_VARIABLES.contentPaddingTop).toBe('--layout-content-padding-top')
      expect(LAYOUT_CSS_VARIABLES.drawerLeftWidth).toBe('--layout-drawer-left-width')
      expect(LAYOUT_CSS_VARIABLES.drawerRightWidth).toBe('--layout-drawer-right-width')
      expect(LAYOUT_CSS_VARIABLES.drawerLeftConfiguredWidth).toBe('--layout-drawer-left-configured-width')
      expect(LAYOUT_CSS_VARIABLES.drawerRightConfiguredWidth).toBe('--layout-drawer-right-configured-width')
      expect(LAYOUT_CSS_VARIABLES.contentMarginTop).toBe('--layout-content-margin-top')
      expect(LAYOUT_CSS_VARIABLES.contentMarginLeft).toBe('--layout-content-margin-left')
      expect(LAYOUT_CSS_VARIABLES.contentMarginRight).toBe('--layout-content-margin-right')
    })
  })

  describe('AppBar Visibility', () => {
    it('should initialize with visible AppBar', () => {
      using(new LayoutService(), (service) => {
        expect(service.appBarVisible.getValue()).toBe(true)
      })
    })

    it('should allow setting AppBar visibility', () => {
      using(new LayoutService(), (service) => {
        service.appBarVisible.setValue(false)

        expect(service.appBarVisible.getValue()).toBe(false)
      })
    })
  })

  describe('AppBar Height', () => {
    it('should initialize with default height', () => {
      using(new LayoutService(), (service) => {
        expect(service.appBarHeight.getValue()).toBe('48px')
      })
    })

    it('should allow setting AppBar height', () => {
      using(new LayoutService(), (service) => {
        service.appBarHeight.setValue('64px')

        expect(service.appBarHeight.getValue()).toBe('64px')
      })
    })
  })

  describe('Gap Management', () => {
    describe('topGap', () => {
      it('should initialize with default value', () => {
        using(new LayoutService(), (service) => {
          expect(service.topGap.getValue()).toBe('0px')
        })
      })

      it('should allow setting topGap via setTopGap', () => {
        using(new LayoutService(), (service) => {
          service.setTopGap('16px')

          expect(service.topGap.getValue()).toBe('16px')
        })
      })

      it('should allow setting topGap via observable', () => {
        using(new LayoutService(), (service) => {
          service.topGap.setValue('32px')

          expect(service.topGap.getValue()).toBe('32px')
        })
      })
    })

    describe('sideGap', () => {
      it('should initialize with default value', () => {
        using(new LayoutService(), (service) => {
          expect(service.sideGap.getValue()).toBe('0px')
        })
      })

      it('should allow setting sideGap via setSideGap', () => {
        using(new LayoutService(), (service) => {
          service.setSideGap('24px')

          expect(service.sideGap.getValue()).toBe('24px')
        })
      })

      it('should allow setting sideGap via observable', () => {
        using(new LayoutService(), (service) => {
          service.sideGap.setValue('48px')

          expect(service.sideGap.getValue()).toBe('48px')
        })
      })
    })
  })

  describe('Disposal', () => {
    it('should dispose all observables', () => {
      const service = new LayoutService()
      const drawerStateSpy = vi.spyOn(service.drawerState, Symbol.dispose)
      const appBarVisibleSpy = vi.spyOn(service.appBarVisible, Symbol.dispose)
      const appBarHeightSpy = vi.spyOn(service.appBarHeight, Symbol.dispose)
      const topGapSpy = vi.spyOn(service.topGap, Symbol.dispose)
      const sideGapSpy = vi.spyOn(service.sideGap, Symbol.dispose)

      service[Symbol.dispose]()

      expect(drawerStateSpy).toHaveBeenCalled()
      expect(appBarVisibleSpy).toHaveBeenCalled()
      expect(appBarHeightSpy).toHaveBeenCalled()
      expect(topGapSpy).toHaveBeenCalled()
      expect(sideGapSpy).toHaveBeenCalled()
    })
  })

  describe('Server-Side Rendering Compatibility', () => {
    it('should not throw when document is undefined', () => {
      vi.stubGlobal('document', undefined)

      expect(() => {
        using(new LayoutService(), (service) => {
          // Should not throw when updating CSS variables
          service.initDrawer('left', { open: true, width: '240px', variant: 'collapsible' })
          service.setTopGap('16px')
          service.setSideGap('24px')
        })
      }).not.toThrow()
    })
  })

  describe('Observable Subscriptions', () => {
    it('should notify subscribers when drawer state changes', () => {
      using(new LayoutService(), (service) => {
        const states: Array<{ left?: { open: boolean; width: string; variant: string } }> = []

        service.drawerState.subscribe((state) => {
          states.push(state)
        })

        service.initDrawer('left', { open: false, width: '240px', variant: 'collapsible' })
        service.setDrawerOpen('left', true)

        expect(states.length).toBe(2) // 2 changes (initDrawer + setDrawerOpen)
        expect(states[states.length - 1].left?.open).toBe(true)
        expect(states[states.length - 1].left?.variant).toBe('collapsible')
      })
    })

    it('should notify subscribers when topGap changes', () => {
      using(new LayoutService(), (service) => {
        const values: string[] = []

        service.topGap.subscribe((value) => {
          values.push(value)
        })

        service.setTopGap('16px')
        service.setTopGap('32px')

        expect(values).toEqual(['16px', '32px'])
      })
    })

    it('should notify subscribers when sideGap changes', () => {
      using(new LayoutService(), (service) => {
        const values: string[] = []

        service.sideGap.subscribe((value) => {
          values.push(value)
        })

        service.setSideGap('24px')
        service.setSideGap('48px')

        expect(values).toEqual(['24px', '48px'])
      })
    })
  })

  describe('LAYOUT_CSS_VARIABLES', () => {
    it('should export all CSS variable names', () => {
      expect(LAYOUT_CSS_VARIABLES).toEqual({
        appBarHeight: '--layout-appbar-height',
        topGap: '--layout-top-gap',
        sideGap: '--layout-side-gap',
        contentPaddingTop: '--layout-content-padding-top',
        contentAvailableHeight: '--layout-content-available-height',
        drawerLeftWidth: '--layout-drawer-left-width',
        drawerRightWidth: '--layout-drawer-right-width',
        drawerLeftConfiguredWidth: '--layout-drawer-left-configured-width',
        drawerRightConfiguredWidth: '--layout-drawer-right-configured-width',
        contentMarginTop: '--layout-content-margin-top',
        contentMarginLeft: '--layout-content-margin-left',
        contentMarginRight: '--layout-content-margin-right',
      })
    })
  })
})
