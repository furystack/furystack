import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FilterDropdown } from './filter-dropdown.js'

describe('FilterDropdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render children inside panel', async () => {
    const onClose = vi.fn()
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root')!
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <FilterDropdown onClose={onClose}>
            <span className="test-child">Hello</span>
          </FilterDropdown>
        ),
      })
      await flushUpdates()

      const dropdown = document.querySelector('data-grid-filter-dropdown')
      expect(dropdown).not.toBeNull()

      const panel = dropdown?.querySelector('.filter-dropdown-panel')
      expect(panel).not.toBeNull()

      const child = panel?.querySelector('.test-child')
      expect(child).not.toBeNull()
      expect(child?.textContent).toBe('Hello')
    })
  })

  it('should add visible class after animation frame', async () => {
    const onClose = vi.fn()
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root')!
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <FilterDropdown onClose={onClose}>
            <span>Content</span>
          </FilterDropdown>
        ),
      })
      await flushUpdates()
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      const panel = document.querySelector('.filter-dropdown-panel')
      expect(panel?.classList.contains('visible')).toBe(true)
    })
  })

  it('should stop click propagation on panel', async () => {
    const onClose = vi.fn()
    const outerClick = vi.fn()
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root')!
      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <div onclick={outerClick}>
            <FilterDropdown onClose={onClose}>
              <span className="inner">Content</span>
            </FilterDropdown>
          </div>
        ),
      })
      await flushUpdates()

      const panel = document.querySelector('.filter-dropdown-panel') as HTMLElement
      panel?.click()
      await flushUpdates()

      expect(outerClick).not.toHaveBeenCalled()
    })
  })
})
