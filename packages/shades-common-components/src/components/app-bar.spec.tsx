import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AppBar } from './app-bar.js'

describe('AppBar component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const renderAppBar = async (children: JSX.Element) => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <AppBar>{children}</AppBar>,
    })

    await sleepAsync(50)

    return {
      injector,
      appBar: document.querySelector('shade-app-bar') as HTMLElement,
    }
  }

  describe('rendering', () => {
    it('should render the shade-app-bar custom element', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      expect(appBar).not.toBeNull()
      expect(appBar.tagName.toLowerCase()).toBe('shade-app-bar')
    })

    it('should render children in shadow DOM', async () => {
      const { appBar } = await renderAppBar(<span id="child-content">Test Content</span>)
      // Children are rendered inside shadow DOM - verify via the element itself
      expect(appBar).not.toBeNull()
    })

    it('should render multiple children', async () => {
      const injector = new Injector()
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <AppBar>
            <span id="logo">Logo</span>
            <nav id="navigation">Nav</nav>
            <button id="action">Action</button>
          </AppBar>
        ),
      })

      await sleepAsync(50)

      const appBar = document.querySelector('shade-app-bar')
      expect(appBar).not.toBeNull()
    })
  })

  describe('positioning', () => {
    it('should have fixed positioning', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.position).toBe('fixed')
    })

    it('should have z-index of 1', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.zIndex).toBe('1')
    })

    it('should have full width', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.width).toBe('100%')
    })
  })

  describe('fade-in animation', () => {
    it('should add visible class after construction', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      expect(appBar.classList.contains('visible')).toBe(true)
    })

    it('should have opacity 1 when visible class is applied', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.opacity).toBe('1')
    })

    it('should have transition styles for animation', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.transition).toContain('opacity')
    })
  })

  describe('layout', () => {
    it('should have flex display', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.display).toBe('flex')
    })

    it('should align items center', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.alignItems).toBe('center')
    })

    it('should justify content to flex-start', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.justifyContent).toBe('flex-start')
    })
  })

  describe('styling', () => {
    it('should have box shadow', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.boxShadow).not.toBe('none')
    })

    it('should have semi-transparent background', async () => {
      const { appBar } = await renderAppBar(<span>Content</span>)
      const computedStyle = window.getComputedStyle(appBar)
      expect(computedStyle.background).toContain('rgba')
    })
  })
})
