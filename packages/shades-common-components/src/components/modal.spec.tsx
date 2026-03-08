import { Injector } from '@furystack/inject'
import { initializeShadeRoot, createComponent, Shade, flushUpdates, SpatialNavigationService } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Modal } from './modal.js'

describe('Modal', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('visibility', () => {
    it('should render when isVisible is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await flushUpdates()
        expect(document.body.innerHTML).toContain('shade-backdrop')
        expect(document.body.innerHTML).toContain('modal-content')
      })
    })

    it('should not render when isVisible is false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={false}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await flushUpdates()
        expect(document.body.innerHTML).not.toContain('shade-backdrop')
        expect(document.body.innerHTML).not.toContain('modal-content')
      })
    })

    it('should show modal when isVisible changes from false to true', async () => {
      let setVisible!: (v: boolean) => void

      const Wrapper = Shade({
        customElementName: 'modal-visibility-test-show',
        render: ({ useState }) => {
          const [visible, setter] = useState('visible', false)
          setVisible = setter
          return (
            <Modal isVisible={visible}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          )
        },
      })

      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({ injector, rootElement, jsxElement: <Wrapper /> })
        await flushUpdates()
        expect(document.body.innerHTML).not.toContain('modal-content')

        setVisible(true)
        await flushUpdates()

        expect(document.body.innerHTML).toContain('shade-backdrop')
        expect(document.body.innerHTML).toContain('modal-content')
      })
    })

    it('should hide modal when isVisible changes from true to false', async () => {
      let setVisible!: (v: boolean) => void

      const Wrapper = Shade({
        customElementName: 'modal-visibility-test-hide',
        render: ({ useState }) => {
          const [visible, setter] = useState('visible', true)
          setVisible = setter
          return (
            <Modal isVisible={visible}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          )
        },
      })

      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({ injector, rootElement, jsxElement: <Wrapper /> })
        await flushUpdates()
        expect(document.body.innerHTML).toContain('modal-content')

        setVisible(false)
        await flushUpdates()

        expect(document.body.innerHTML).not.toContain('shade-backdrop')
        expect(document.body.innerHTML).not.toContain('modal-content')
      })
    })
  })

  describe('backdrop click', () => {
    it('should call onClose when backdrop is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onClose = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true} onClose={onClose}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await flushUpdates()
        const backdrop = document.querySelector('.shade-backdrop') as HTMLDivElement
        expect(backdrop).not.toBeNull()

        backdrop.click()
        await flushUpdates()

        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should call hideAnimation before onClose when backdrop is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const callOrder: string[] = []
        const hideAnimation = vi.fn(async () => {
          callOrder.push('hideAnimation')
        })
        const onClose = vi.fn(() => {
          callOrder.push('onClose')
        })

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true} onClose={onClose} hideAnimation={hideAnimation}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await flushUpdates()
        const backdrop = document.querySelector('.shade-backdrop') as HTMLDivElement
        backdrop.click()
        await flushUpdates()

        expect(hideAnimation).toHaveBeenCalledTimes(1)
        expect(onClose).toHaveBeenCalledTimes(1)
        expect(callOrder).toEqual(['hideAnimation', 'onClose'])
      })
    })
  })

  describe('animations', () => {
    it('should call showAnimation when modal becomes visible', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const showAnimation = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true} showAnimation={showAnimation}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await flushUpdates()
        expect(showAnimation).toHaveBeenCalled()
      })
    })

    it('should call showAnimation with element when visibility changes to true', async () => {
      let setVisible!: (v: boolean) => void
      const showAnimation = vi.fn()

      const Wrapper = Shade({
        customElementName: 'modal-show-animation-test',
        render: ({ useState }) => {
          const [visible, setter] = useState('visible', false)
          setVisible = setter
          return (
            <Modal isVisible={visible} showAnimation={showAnimation}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          )
        },
      })

      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({ injector, rootElement, jsxElement: <Wrapper /> })
        await flushUpdates()
        expect(showAnimation).not.toHaveBeenCalled()

        setVisible(true)
        await flushUpdates()

        expect(showAnimation).toHaveBeenCalled()
        expect(showAnimation.mock.calls[0][0]).toBeInstanceOf(Element)
      })
    })

    it('should call hideAnimation with element on backdrop click', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const hideAnimation = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true} hideAnimation={hideAnimation}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await flushUpdates()
        const backdrop = document.querySelector('.shade-backdrop') as HTMLDivElement
        backdrop.click()
        await flushUpdates()

        expect(hideAnimation).toHaveBeenCalled()
        expect(hideAnimation.mock.calls[0][0]).toBeInstanceOf(Element)
      })
    })
  })

  describe('styling', () => {
    it('should apply custom backdropStyle', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const backdropStyle: Partial<CSSStyleDeclaration> = {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: '1000',
        }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true} backdropStyle={backdropStyle}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await flushUpdates()
        const backdrop = document.querySelector('.shade-backdrop') as HTMLDivElement
        expect(backdrop).not.toBeNull()
        expect(backdrop.style.backgroundColor).toBe('rgba(0, 0, 0, 0.5)')
        expect(backdrop.style.zIndex).toBe('1000')
      })
    })
  })

  describe('children', () => {
    it('should render children inside the backdrop', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true}>
              <div id="child-1">First Child</div>
              <div id="child-2">Second Child</div>
            </Modal>
          ),
        })

        await flushUpdates()
        const backdrop = document.querySelector('.shade-backdrop') as HTMLDivElement
        expect(backdrop).not.toBeNull()
        expect(backdrop.innerHTML).toContain('child-1')
        expect(backdrop.innerHTML).toContain('child-2')
      })
    })
  })

  describe('spatial navigation', () => {
    it('should render with data-nav-section attribute when visible', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true}>
              <div>Content</div>
            </Modal>
          ),
        })

        await flushUpdates()
        const backdrop = document.querySelector('.shade-backdrop')
        expect(backdrop?.getAttribute('data-nav-section')).toBeTruthy()
      })
    })

    it('should render with custom navSection name', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true} navSection="my-modal">
              <div>Content</div>
            </Modal>
          ),
        })

        await flushUpdates()
        const backdrop = document.querySelector('.shade-backdrop')
        expect(backdrop?.getAttribute('data-nav-section')).toBe('my-modal')
      })
    })

    it('should lock activeSection when trapFocus is true and service is active', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const spatialNav = injector.getInstance(SpatialNavigationService)

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true} trapFocus={true} navSection="trapped-modal">
              <div>Content</div>
            </Modal>
          ),
        })

        await flushUpdates()

        expect(spatialNav.activeSection.getValue()).toBe('trapped-modal')

        spatialNav.activeSection.setValue('other-section')
        expect(spatialNav.activeSection.getValue()).toBe('trapped-modal')
      })
    })

    it('should not lock activeSection when trapFocus is false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const spatialNav = injector.getInstance(SpatialNavigationService)

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={true} trapFocus={false}>
              <div>Content</div>
            </Modal>
          ),
        })

        await flushUpdates()

        spatialNav.activeSection.setValue('other-section')
        expect(spatialNav.activeSection.getValue()).toBe('other-section')
      })
    })
  })
})
