import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
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
    await usingAsync(new Injector(), async (injector) => {
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
      await sleepAsync(50)

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
    await usingAsync(new Injector(), async (injector) => {
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
      await sleepAsync(50)

      const panel = document.querySelector('.filter-dropdown-panel')
      expect(panel?.classList.contains('visible')).toBe(true)
    })
  })

  it('should stop click propagation on panel', async () => {
    const onClose = vi.fn()
    const outerClick = vi.fn()
    await usingAsync(new Injector(), async (injector) => {
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
      await sleepAsync(50)

      const panel = document.querySelector('.filter-dropdown-panel') as HTMLElement
      panel?.click()
      await sleepAsync(50)

      expect(outerClick).not.toHaveBeenCalled()
    })
  })
})
