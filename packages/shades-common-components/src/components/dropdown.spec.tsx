import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Dropdown } from './dropdown.js'
import type { MenuEntry } from './menu/menu-types.js'

describe('Dropdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createTestItems = (): MenuEntry[] => [
    { key: 'cut', label: 'Cut' },
    { key: 'copy', label: 'Copy' },
    { type: 'divider' },
    { key: 'paste', label: 'Paste' },
  ]

  const renderDropdown = async (
    props: Omit<Parameters<typeof Dropdown>[0], 'items'> & { items?: MenuEntry[] },
    triggerText = 'Open',
  ) => {
    const items = props.items ?? createTestItems()
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: (
        <Dropdown {...props} items={items}>
          <button>{triggerText}</button>
        </Dropdown>
      ),
    })
    await sleepAsync(50)
    return {
      injector,
      dropdown: root.querySelector('shade-dropdown') as HTMLElement,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render the dropdown element', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        expect(dropdown).toBeTruthy()
        expect(dropdown.tagName.toLowerCase()).toBe('shade-dropdown')
      })
    })

    it('should render the trigger content', async () => {
      await usingAsync(await renderDropdown({}, 'Click me'), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger')
        expect(trigger).toBeTruthy()
        expect(trigger?.textContent).toContain('Click me')
      })
    })

    it('should not show the dropdown panel initially', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        expect(dropdown.hasAttribute('data-open')).toBe(false)
        const panel = dropdown.querySelector('.dropdown-panel')
        expect(panel).toBeTruthy()
        expect(panel?.classList.contains('visible')).toBe(false)
      })
    })
  })

  describe('opening and closing', () => {
    it('should open when trigger is clicked', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const panel = dropdown.querySelector('.dropdown-panel')
        expect(panel).toBeTruthy()
      })
    })

    it('should show menu items when open', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const items = dropdown.querySelectorAll('[role="menuitem"]')
        expect(items.length).toBe(3)
        expect(dropdown.textContent).toContain('Cut')
        expect(dropdown.textContent).toContain('Copy')
        expect(dropdown.textContent).toContain('Paste')
      })
    })

    it('should show dividers when open', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const dividers = dropdown.querySelectorAll('[role="separator"]')
        expect(dividers.length).toBe(1)
      })
    })

    it('should close when backdrop is clicked', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const backdrop = dropdown.querySelector('.dropdown-backdrop') as HTMLElement
        backdrop.click()
        await sleepAsync(50)

        expect(dropdown.hasAttribute('data-open')).toBe(false)
        const panel = dropdown.querySelector('.dropdown-panel')
        expect(panel?.classList.contains('visible')).toBe(false)
      })
    })

    it('should toggle when trigger is clicked twice', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)
        expect(dropdown.hasAttribute('data-open')).toBe(true)

        trigger.click()
        await sleepAsync(50)
        expect(dropdown.hasAttribute('data-open')).toBe(false)
      })
    })
  })

  describe('item selection', () => {
    it('should call onSelect when an item is clicked', async () => {
      const handleSelect = vi.fn()
      await usingAsync(await renderDropdown({ onSelect: handleSelect }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const item = dropdown.querySelector('[data-key="copy"]') as HTMLElement
        item.click()
        await sleepAsync(50)

        expect(handleSelect).toHaveBeenCalledWith('copy')
      })
    })

    it('should close after selection', async () => {
      await usingAsync(await renderDropdown({ onSelect: vi.fn() }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const item = dropdown.querySelector('[data-key="cut"]') as HTMLElement
        item.click()
        await sleepAsync(50)

        expect(dropdown.hasAttribute('data-open')).toBe(false)
        const panel = dropdown.querySelector('.dropdown-panel')
        expect(panel?.classList.contains('visible')).toBe(false)
      })
    })

    it('should not call onSelect for disabled items', async () => {
      const handleSelect = vi.fn()
      const items: MenuEntry[] = [{ key: 'disabled', label: 'Disabled', disabled: true }]
      await usingAsync(await renderDropdown({ items, onSelect: handleSelect }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const item = dropdown.querySelector('[data-key="disabled"]') as HTMLElement
        item.click()
        await sleepAsync(50)

        expect(handleSelect).not.toHaveBeenCalled()
      })
    })
  })

  describe('disabled state', () => {
    it('should not open when disabled', async () => {
      await usingAsync(await renderDropdown({ disabled: true }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        expect(dropdown.hasAttribute('data-open')).toBe(false)
        const panel = dropdown.querySelector('.dropdown-panel')
        expect(panel?.classList.contains('visible')).toBe(false)
      })
    })

    it('should mark trigger as disabled', async () => {
      await usingAsync(await renderDropdown({ disabled: true }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        expect(trigger.classList.contains('disabled')).toBe(true)
      })
    })

    it('should not mark trigger as disabled when not disabled', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        expect(trigger.classList.contains('disabled')).toBe(false)
      })
    })
  })

  describe('groups', () => {
    it('should render groups in dropdown', async () => {
      const items: MenuEntry[] = [
        {
          type: 'group',
          key: 'actions',
          label: 'Actions',
          children: [
            { key: 'save', label: 'Save' },
            { key: 'delete', label: 'Delete' },
          ],
        },
      ]
      await usingAsync(await renderDropdown({ items }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const group = dropdown.querySelector('[role="group"]')
        expect(group).toBeTruthy()

        const menuItems = dropdown.querySelectorAll('[role="menuitem"]')
        expect(menuItems.length).toBe(2)
      })
    })
  })

  describe('item icons', () => {
    it('should render item icons', async () => {
      const items: MenuEntry[] = [{ key: 'cut', label: 'Cut', icon: <span className="icon">✂️</span> }]
      await usingAsync(await renderDropdown({ items }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const icon = dropdown.querySelector('.dropdown-item-icon')
        expect(icon).toBeTruthy()
        expect(icon?.textContent).toContain('✂️')
      })
    })

    it('should render JSX element icons', async () => {
      const items: MenuEntry[] = [{ key: 'cut', label: 'Cut', icon: <span>X</span> }]
      await usingAsync(await renderDropdown({ items }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const icon = dropdown.querySelector('.dropdown-item-icon')
        expect(icon).toBeTruthy()
        expect(icon?.textContent).toContain('X')
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should close on Escape key', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)
        expect(dropdown.hasAttribute('data-open')).toBe(true)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await sleepAsync(50)

        expect(dropdown.hasAttribute('data-open')).toBe(false)
      })
    })

    it('should navigate to next item on ArrowDown', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await sleepAsync(50)

        const focusedItems = dropdown.querySelectorAll('.dropdown-item.focused')
        expect(focusedItems.length).toBe(1)
      })
    })

    it('should navigate to previous item on ArrowUp', async () => {
      await usingAsync(await renderDropdown({}), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        // Move down twice then up once
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
        await sleepAsync(50)

        const focusedItems = dropdown.querySelectorAll('.dropdown-item.focused')
        expect(focusedItems.length).toBe(1)
      })
    })

    it('should select focused item on Enter', async () => {
      const handleSelect = vi.fn()
      await usingAsync(await renderDropdown({ onSelect: handleSelect }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        // Navigate down then press Enter
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await sleepAsync(50)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await sleepAsync(50)

        expect(handleSelect).toHaveBeenCalled()
      })
    })

    it('should wrap around when navigating past the last item', async () => {
      const items: MenuEntry[] = [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ]
      await usingAsync(await renderDropdown({ items }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        // Navigate down past the end (2 items + 1 wrap)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await sleepAsync(50)

        const focusedItems = dropdown.querySelectorAll('.dropdown-item.focused')
        expect(focusedItems.length).toBe(1)
      })
    })

    it('should wrap around when navigating before the first item', async () => {
      const items: MenuEntry[] = [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ]
      await usingAsync(await renderDropdown({ items }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
        await sleepAsync(50)

        const focusedItems = dropdown.querySelectorAll('.dropdown-item.focused')
        expect(focusedItems.length).toBe(1)
      })
    })

    it('should not respond to keyboard when closed', async () => {
      const handleSelect = vi.fn()
      await usingAsync(await renderDropdown({ onSelect: handleSelect }), async ({ dropdown }) => {
        // Don't open the dropdown
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await sleepAsync(50)

        expect(handleSelect).not.toHaveBeenCalled()
        expect(dropdown.hasAttribute('data-open')).toBe(false)
      })
    })

    it('should skip disabled items during navigation', async () => {
      const items: MenuEntry[] = [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B', disabled: true },
        { key: 'c', label: 'C' },
      ]
      await usingAsync(await renderDropdown({ items }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        // Navigate to first enabled item
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await sleepAsync(50)

        const focusedItems = dropdown.querySelectorAll('.dropdown-item.focused')
        expect(focusedItems.length).toBe(1)
        // Focused item should not be the disabled one
        expect(focusedItems[0].classList.contains('disabled')).toBe(false)
      })
    })
  })

  describe('placement', () => {
    it('should accept bottomRight placement', async () => {
      await usingAsync(await renderDropdown({ placement: 'bottomRight' }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const panel = dropdown.querySelector('.dropdown-panel')
        expect(panel).toBeTruthy()
      })
    })

    it('should accept topLeft placement', async () => {
      await usingAsync(await renderDropdown({ placement: 'topLeft' }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const panel = dropdown.querySelector('.dropdown-panel')
        expect(panel).toBeTruthy()
      })
    })

    it('should accept topRight placement', async () => {
      await usingAsync(await renderDropdown({ placement: 'topRight' }), async ({ dropdown }) => {
        const trigger = dropdown.querySelector('.dropdown-trigger') as HTMLElement
        trigger.click()
        await sleepAsync(50)

        const panel = dropdown.querySelector('.dropdown-panel')
        expect(panel).toBeTruthy()
      })
    })
  })
})
