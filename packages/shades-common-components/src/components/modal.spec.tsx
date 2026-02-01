import { Injector } from '@furystack/inject'
import { initializeShadeRoot, createComponent } from '@furystack/shades'
import { ObservableValue, sleepAsync, usingAsync } from '@furystack/utils'
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
        const isVisible = new ObservableValue(true)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('shade-backdrop')
        expect(document.body.innerHTML).toContain('modal-content')
      })
    })

    it('should not render when isVisible is false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const isVisible = new ObservableValue(false)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).not.toContain('shade-backdrop')
        expect(document.body.innerHTML).not.toContain('modal-content')
      })
    })

    it('should show modal when isVisible changes from false to true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const isVisible = new ObservableValue(false)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).not.toContain('modal-content')

        isVisible.setValue(true)
        await sleepAsync(50)

        expect(document.body.innerHTML).toContain('shade-backdrop')
        expect(document.body.innerHTML).toContain('modal-content')
      })
    })

    it('should hide modal when isVisible changes from true to false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const isVisible = new ObservableValue(true)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        expect(document.body.innerHTML).toContain('modal-content')

        isVisible.setValue(false)
        await sleepAsync(50)

        expect(document.body.innerHTML).not.toContain('shade-backdrop')
        expect(document.body.innerHTML).not.toContain('modal-content')
      })
    })
  })

  describe('backdrop click', () => {
    it('should call onClose when backdrop is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const isVisible = new ObservableValue(true)
        const onClose = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible} onClose={onClose}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        const backdrop = document.querySelector('.shade-backdrop') as HTMLDivElement
        expect(backdrop).not.toBeNull()

        backdrop.click()
        await sleepAsync(50)

        expect(onClose).toHaveBeenCalledTimes(1)
      })
    })

    it('should call hideAnimation before onClose when backdrop is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const isVisible = new ObservableValue(true)
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
            <Modal isVisible={isVisible} onClose={onClose} hideAnimation={hideAnimation}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        const backdrop = document.querySelector('.shade-backdrop') as HTMLDivElement
        backdrop.click()
        await sleepAsync(50)

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
        const isVisible = new ObservableValue(true)
        const showAnimation = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible} showAnimation={showAnimation}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        expect(showAnimation).toHaveBeenCalled()
      })
    })

    it('should call showAnimation with element when visibility changes to true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const isVisible = new ObservableValue(false)
        const showAnimation = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible} showAnimation={showAnimation}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        expect(showAnimation).not.toHaveBeenCalled()

        isVisible.setValue(true)
        await sleepAsync(50)

        expect(showAnimation).toHaveBeenCalled()
        expect(showAnimation.mock.calls[0][0]).toBeInstanceOf(Element)
      })
    })

    it('should call hideAnimation with element on backdrop click', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const isVisible = new ObservableValue(true)
        const hideAnimation = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible} hideAnimation={hideAnimation}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        const backdrop = document.querySelector('.shade-backdrop') as HTMLDivElement
        backdrop.click()
        await sleepAsync(50)

        expect(hideAnimation).toHaveBeenCalled()
        expect(hideAnimation.mock.calls[0][0]).toBeInstanceOf(Element)
      })
    })
  })

  describe('styling', () => {
    it('should apply custom backdropStyle', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const isVisible = new ObservableValue(true)
        const backdropStyle: Partial<CSSStyleDeclaration> = {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: '1000',
        }

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible} backdropStyle={backdropStyle}>
              <div id="modal-content">Modal Content</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
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
        const isVisible = new ObservableValue(true)

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <Modal isVisible={isVisible}>
              <div id="child-1">First Child</div>
              <div id="child-2">Second Child</div>
            </Modal>
          ),
        })

        await sleepAsync(50)
        const backdrop = document.querySelector('.shade-backdrop') as HTMLDivElement
        expect(backdrop).not.toBeNull()
        expect(backdrop.innerHTML).toContain('child-1')
        expect(backdrop.innerHTML).toContain('child-2')
      })
    })
  })
})
