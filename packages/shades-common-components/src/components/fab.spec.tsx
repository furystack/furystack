import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Fab } from './fab.js'

describe('Fab', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderFab = async (children?: JSX.Element[]) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <Fab>{children}</Fab>,
    })
    await sleepAsync(50)
    return {
      injector,
      fab: root.querySelector('button[is="shade-fab"]') as HTMLButtonElement,
    }
  }

  describe('rendering', () => {
    it('should render a button element', async () => {
      const { fab } = await renderFab()
      expect(fab).toBeTruthy()
      expect(fab.tagName.toLowerCase()).toBe('button')
      expect(fab.getAttribute('is')).toBe('shade-fab')
    })
  })

  describe('positioning', () => {
    it('should have fixed positioning', async () => {
      const { fab } = await renderFab()
      const computedStyle = window.getComputedStyle(fab)
      expect(computedStyle.position).toBe('fixed')
    })

    it('should be positioned at bottom-right corner', async () => {
      const { fab } = await renderFab()
      const computedStyle = window.getComputedStyle(fab)
      expect(computedStyle.bottom).toBe('32px')
      expect(computedStyle.right).toBe('32px')
    })
  })

  describe('children', () => {
    it('should render text children', async () => {
      const { fab } = await renderFab(['+'] as unknown as JSX.Element[])
      expect(fab.textContent).toContain('+')
    })

    it('should render element children', async () => {
      const { fab } = await renderFab([<span>🚀</span>])
      expect(fab.textContent).toContain('🚀')
    })
  })

  describe('styling', () => {
    it('should have circular shape', async () => {
      const { fab } = await renderFab()
      const computedStyle = window.getComputedStyle(fab)
      expect(computedStyle.borderRadius).toBe('50%')
    })

    it('should have fixed dimensions', async () => {
      const { fab } = await renderFab()
      const computedStyle = window.getComputedStyle(fab)
      expect(computedStyle.width).toBe('64px')
      expect(computedStyle.height).toBe('64px')
    })

    it('should center content with flexbox', async () => {
      const { fab } = await renderFab()
      const computedStyle = window.getComputedStyle(fab)
      expect(computedStyle.display).toBe('flex')
      expect(computedStyle.justifyContent).toBe('center')
      expect(computedStyle.alignItems).toBe('center')
    })
  })

  describe('button functionality', () => {
    it('should trigger onclick handler when clicked', async () => {
      const handleClick = vi.fn()
      const injector = new Injector()
      const root = document.getElementById('root')!
      initializeShadeRoot({
        injector,
        rootElement: root,
        jsxElement: <Fab onclick={handleClick}>+</Fab>,
      })
      await sleepAsync(50)
      const fab = root.querySelector('button[is="shade-fab"]') as HTMLButtonElement

      fab.click()

      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})
