import { using } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LayoutService } from './layout-service.js'

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
      })
    })

    it('should update CSS variables on initialization', () => {
      using(new LayoutService(), () => {
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-appbar-height', '48px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-top', '48px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-left-width', '0px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-right-width', '0px')
      })
    })
  })

  describe('Drawer State Management', () => {
    describe('toggleDrawer', () => {
      it('should toggle drawer from closed to open', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: false, width: '240px' })

          service.toggleDrawer('left')

          expect(service.drawerState.getValue().left?.open).toBe(true)
        })
      })

      it('should toggle drawer from open to closed', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px' })

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
          service.initDrawer('left', { open: true, width: '240px' })
          service.initDrawer('right', { open: false, width: '200px' })

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

      it('should preserve existing width when setting open state', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: false, width: '300px' })

          service.setDrawerOpen('left', true)

          expect(service.drawerState.getValue().left?.width).toBe('300px')
        })
      })
    })

    describe('setDrawerWidth', () => {
      it('should set drawer width', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px' })

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

      it('should preserve open state when setting width', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px' })

          service.setDrawerWidth('left', '300px')

          expect(service.drawerState.getValue().left?.open).toBe(true)
        })
      })
    })

    describe('initDrawer', () => {
      it('should initialize left drawer', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '250px' })

          expect(service.drawerState.getValue().left).toEqual({ open: true, width: '250px' })
        })
      })

      it('should initialize right drawer', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('right', { open: false, width: '200px' })

          expect(service.drawerState.getValue().right).toEqual({ open: false, width: '200px' })
        })
      })

      it('should initialize both drawers', () => {
        using(new LayoutService(), (service) => {
          service.initDrawer('left', { open: true, width: '240px' })
          service.initDrawer('right', { open: true, width: '200px' })

          expect(service.drawerState.getValue()).toEqual({
            left: { open: true, width: '240px' },
            right: { open: true, width: '200px' },
          })
        })
      })
    })
  })

  describe('CSS Variables', () => {
    it('should update CSS variables when drawer opens', () => {
      using(new LayoutService(), (service) => {
        mockSetProperty.mockClear()

        service.initDrawer('left', { open: true, width: '240px' })

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-left-width', '240px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-left', '240px')
      })
    })

    it('should set drawer width to 0 when closed', () => {
      using(new LayoutService(), (service) => {
        service.initDrawer('left', { open: true, width: '240px' })
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

        service.initDrawer('right', { open: true, width: '200px' })

        expect(mockSetProperty).toHaveBeenCalledWith('--layout-drawer-right-width', '200px')
        expect(mockSetProperty).toHaveBeenCalledWith('--layout-content-margin-right', '200px')
      })
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

  describe('Disposal', () => {
    it('should dispose all observables', () => {
      const service = new LayoutService()
      const drawerStateSpy = vi.spyOn(service.drawerState, Symbol.dispose)
      const appBarVisibleSpy = vi.spyOn(service.appBarVisible, Symbol.dispose)
      const appBarHeightSpy = vi.spyOn(service.appBarHeight, Symbol.dispose)

      service[Symbol.dispose]()

      expect(drawerStateSpy).toHaveBeenCalled()
      expect(appBarVisibleSpy).toHaveBeenCalled()
      expect(appBarHeightSpy).toHaveBeenCalled()
    })
  })

  describe('Server-Side Rendering Compatibility', () => {
    it('should not throw when document is undefined', () => {
      vi.stubGlobal('document', undefined)

      expect(() => {
        using(new LayoutService(), (service) => {
          // Should not throw when updating CSS variables
          service.initDrawer('left', { open: true, width: '240px' })
        })
      }).not.toThrow()
    })
  })

  describe('Observable Subscriptions', () => {
    it('should notify subscribers when drawer state changes', () => {
      using(new LayoutService(), (service) => {
        const states: Array<{ left?: { open: boolean; width: string } }> = []

        service.drawerState.subscribe((state) => {
          states.push(state)
        })

        service.initDrawer('left', { open: false, width: '240px' })
        service.setDrawerOpen('left', true)

        expect(states.length).toBe(2) // 2 changes (initDrawer + setDrawerOpen)
        expect(states[states.length - 1].left?.open).toBe(true)
      })
    })
  })
})
