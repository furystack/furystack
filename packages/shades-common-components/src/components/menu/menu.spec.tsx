import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MenuEntry } from './menu-types.js'
import { Menu } from './menu.js'

describe('Menu', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createTestItems = (): MenuEntry[] => [
    { key: 'home', label: 'Home' },
    { key: 'about', label: 'About' },
    { type: 'divider' },
    { key: 'settings', label: 'Settings' },
  ]

  const renderMenu = async (props: Parameters<typeof Menu>[0]) => {
    const injector = new Injector()
    const root = document.getElementById('root')!
    initializeShadeRoot({
      injector,
      rootElement: root,
      jsxElement: <Menu {...props} />,
    })
    await sleepAsync(50)
    return {
      injector,
      menu: root.querySelector('shade-menu') as HTMLElement,
      [Symbol.asyncDispose]: () => injector[Symbol.asyncDispose](),
    }
  }

  describe('rendering', () => {
    it('should render a menu element', async () => {
      await usingAsync(await renderMenu({ items: createTestItems() }), async ({ menu }) => {
        expect(menu).toBeTruthy()
        expect(menu.tagName.toLowerCase()).toBe('shade-menu')
      })
    })

    it('should render menu items', async () => {
      await usingAsync(await renderMenu({ items: createTestItems() }), async ({ menu }) => {
        const items = menu.querySelectorAll('[role="menuitem"]')
        expect(items.length).toBe(3)
      })
    })

    it('should render dividers', async () => {
      await usingAsync(await renderMenu({ items: createTestItems() }), async ({ menu }) => {
        const dividers = menu.querySelectorAll('[role="separator"]')
        expect(dividers.length).toBe(1)
      })
    })

    it('should render item labels', async () => {
      await usingAsync(await renderMenu({ items: createTestItems() }), async ({ menu }) => {
        expect(menu.textContent).toContain('Home')
        expect(menu.textContent).toContain('About')
        expect(menu.textContent).toContain('Settings')
      })
    })

    it('should render item icons when provided', async () => {
      const items: MenuEntry[] = [{ key: 'home', label: 'Home', icon: <span className="test-icon">🏠</span> }]
      await usingAsync(await renderMenu({ items }), async ({ menu }) => {
        const icon = menu.querySelector('.menu-item-icon')
        expect(icon).toBeTruthy()
        expect(icon?.textContent).toContain('🏠')
      })
    })
  })

  describe('modes', () => {
    it('should default to vertical mode', async () => {
      await usingAsync(await renderMenu({ items: createTestItems() }), async ({ menu }) => {
        expect(menu.getAttribute('data-mode')).toBe('vertical')
        expect(menu.getAttribute('role')).toBe('menu')
      })
    })

    it('should set horizontal mode', async () => {
      await usingAsync(await renderMenu({ items: createTestItems(), mode: 'horizontal' }), async ({ menu }) => {
        expect(menu.getAttribute('data-mode')).toBe('horizontal')
        expect(menu.getAttribute('role')).toBe('menubar')
      })
    })

    it('should set inline mode', async () => {
      await usingAsync(await renderMenu({ items: createTestItems(), mode: 'inline' }), async ({ menu }) => {
        expect(menu.getAttribute('data-mode')).toBe('inline')
        expect(menu.getAttribute('role')).toBe('menu')
      })
    })
  })

  describe('selected state', () => {
    it('should mark the selected item', async () => {
      await usingAsync(await renderMenu({ items: createTestItems(), selectedKey: 'home' }), async ({ menu }) => {
        const selectedItem = menu.querySelector('[data-key="home"]')
        expect(selectedItem?.classList.contains('selected')).toBe(true)
      })
    })

    it('should not mark unselected items', async () => {
      await usingAsync(await renderMenu({ items: createTestItems(), selectedKey: 'home' }), async ({ menu }) => {
        const aboutItem = menu.querySelector('[data-key="about"]')
        expect(aboutItem?.classList.contains('selected')).toBe(false)
      })
    })
  })

  describe('disabled items', () => {
    it('should mark disabled items with disabled class', async () => {
      const items: MenuEntry[] = [{ key: 'disabled-item', label: 'Disabled', disabled: true }]
      await usingAsync(await renderMenu({ items }), async ({ menu }) => {
        const item = menu.querySelector('[data-key="disabled-item"]')
        expect(item?.classList.contains('disabled')).toBe(true)
      })
    })

    it('should not call onSelect for disabled items', async () => {
      const handleSelect = vi.fn()
      const items: MenuEntry[] = [{ key: 'disabled-item', label: 'Disabled', disabled: true }]
      await usingAsync(await renderMenu({ items, onSelect: handleSelect }), async ({ menu }) => {
        const item = menu.querySelector('[data-key="disabled-item"]') as HTMLElement
        item.click()
        expect(handleSelect).not.toHaveBeenCalled()
      })
    })
  })

  describe('item selection', () => {
    it('should call onSelect when an item is clicked', async () => {
      const handleSelect = vi.fn()
      await usingAsync(await renderMenu({ items: createTestItems(), onSelect: handleSelect }), async ({ menu }) => {
        const item = menu.querySelector('[data-key="home"]') as HTMLElement
        item.click()
        expect(handleSelect).toHaveBeenCalledWith('home')
      })
    })
  })

  describe('groups', () => {
    it('should render groups with labels', async () => {
      const items: MenuEntry[] = [
        {
          type: 'group',
          key: 'group1',
          label: 'My Group',
          children: [
            { key: 'a', label: 'Item A' },
            { key: 'b', label: 'Item B' },
          ],
        },
      ]
      await usingAsync(await renderMenu({ items }), async ({ menu }) => {
        const group = menu.querySelector('[role="group"]')
        expect(group).toBeTruthy()
        expect(menu.textContent).toContain('My Group')

        const groupItems = menu.querySelectorAll('[role="menuitem"]')
        expect(groupItems.length).toBe(2)
      })
    })

    it('should render group children in vertical mode (always expanded)', async () => {
      const items: MenuEntry[] = [
        {
          type: 'group',
          key: 'group1',
          label: 'Group',
          children: [
            { key: 'a', label: 'Item A' },
            { key: 'b', label: 'Item B' },
          ],
        },
      ]
      await usingAsync(await renderMenu({ items, mode: 'vertical' }), async ({ menu }) => {
        expect(menu.textContent).toContain('Item A')
        expect(menu.textContent).toContain('Item B')
      })
    })
  })

  describe('inline mode groups', () => {
    it('should start with groups collapsed in inline mode', async () => {
      const items: MenuEntry[] = [
        {
          type: 'group',
          key: 'group1',
          label: 'Collapsible',
          children: [{ key: 'a', label: 'Hidden Item' }],
        },
      ]
      await usingAsync(await renderMenu({ items, mode: 'inline' }), async ({ menu }) => {
        const groupChildren = menu.querySelector('.menu-group-children') as HTMLElement
        expect(groupChildren).toBeTruthy()
        expect(groupChildren.style.display).toBe('none')
      })
    })

    it('should expand a group when its label is clicked', async () => {
      const items: MenuEntry[] = [
        {
          type: 'group',
          key: 'group1',
          label: 'Expandable',
          children: [{ key: 'a', label: 'Revealed Item' }],
        },
      ]
      await usingAsync(await renderMenu({ items, mode: 'inline' }), async ({ menu }) => {
        const groupLabel = menu.querySelector('.menu-group-label-inline') as HTMLElement
        expect(groupLabel).toBeTruthy()
        groupLabel.click()
        await sleepAsync(50)

        const groupItems = menu.querySelectorAll('[role="menuitem"]')
        expect(groupItems.length).toBe(1)
        expect(menu.textContent).toContain('Revealed Item')
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should be focusable', async () => {
      await usingAsync(await renderMenu({ items: createTestItems() }), async ({ menu }) => {
        expect(menu.getAttribute('tabindex')).toBe('0')
      })
    })

    it('should navigate with ArrowDown in vertical mode', async () => {
      await usingAsync(await renderMenu({ items: createTestItems() }), async ({ menu }) => {
        menu.focus()
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await sleepAsync(50)

        const focusedItem = menu.querySelector('.menu-item.focused')
        expect(focusedItem).toBeTruthy()
        expect(focusedItem?.getAttribute('data-key')).toBe('home')
      })
    })

    it('should navigate with ArrowRight in horizontal mode', async () => {
      await usingAsync(await renderMenu({ items: createTestItems(), mode: 'horizontal' }), async ({ menu }) => {
        menu.focus()
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
        await sleepAsync(50)

        const focusedItem = menu.querySelector('.menu-item.focused')
        expect(focusedItem).toBeTruthy()
        expect(focusedItem?.getAttribute('data-key')).toBe('home')
      })
    })

    it('should select item with Enter key', async () => {
      const handleSelect = vi.fn()
      await usingAsync(await renderMenu({ items: createTestItems(), onSelect: handleSelect }), async ({ menu }) => {
        menu.focus()
        // Navigate to first item
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await sleepAsync(50)
        // Press Enter
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await sleepAsync(50)
        expect(handleSelect).toHaveBeenCalledWith('home')
      })
    })

    it('should navigate to last item with End key', async () => {
      await usingAsync(await renderMenu({ items: createTestItems() }), async ({ menu }) => {
        menu.focus()
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
        await sleepAsync(50)

        const focusedItem = menu.querySelector('.menu-item.focused')
        expect(focusedItem?.getAttribute('data-key')).toBe('settings')
      })
    })

    it('should navigate to first item with Home key', async () => {
      await usingAsync(await renderMenu({ items: createTestItems() }), async ({ menu }) => {
        menu.focus()
        // Go to end first
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
        await sleepAsync(50)
        // Then Home
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))
        await sleepAsync(50)

        const focusedItem = menu.querySelector('.menu-item.focused')
        expect(focusedItem?.getAttribute('data-key')).toBe('home')
      })
    })

    it('should wrap around when navigating past the last item', async () => {
      const items: MenuEntry[] = [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ]
      await usingAsync(await renderMenu({ items }), async ({ menu }) => {
        menu.focus()
        // Navigate to end
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))
        await sleepAsync(50)
        // One more down should wrap to first
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await sleepAsync(50)

        const focusedItem = menu.querySelector('.menu-item.focused')
        expect(focusedItem?.getAttribute('data-key')).toBe('a')
      })
    })
  })
})
