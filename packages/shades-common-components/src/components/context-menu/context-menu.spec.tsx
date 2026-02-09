import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContextMenuItem } from './context-menu-manager.js'
import { ContextMenuManager } from './context-menu-manager.js'
import { ContextMenu } from './context-menu.js'

type TestData = { id: number; name: string }

describe('ContextMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  const createTestItems = (): Array<ContextMenuItem<TestData>> => [
    { type: 'item', data: { id: 1, name: 'Cut' }, label: 'Cut' },
    { type: 'item', data: { id: 2, name: 'Copy' }, label: 'Copy' },
    { type: 'separator' },
    { type: 'item', data: { id: 3, name: 'Paste' }, label: 'Paste' },
  ]

  const renderContextMenu = async (options?: { onItemSelect?: (item: TestData) => void }) => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement
    const manager = new ContextMenuManager<TestData>()

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <ContextMenu<TestData> manager={manager} onItemSelect={options?.onItemSelect} />,
    })

    await sleepAsync(50)

    return {
      injector,
      manager,
      getContextMenu: () => document.querySelector('shade-context-menu') as HTMLElement,
      getMenu: () => document.querySelector('[role="menu"]') as HTMLElement,
      getMenuItems: () => document.querySelectorAll('shade-context-menu-item'),
      getSeparators: () => document.querySelectorAll('[role="separator"]'),
      getBackdrop: () => document.querySelector('.context-menu-backdrop') as HTMLElement,
      [Symbol.asyncDispose]: async () => {
        manager[Symbol.dispose]()
        await injector[Symbol.asyncDispose]()
      },
    }
  }

  describe('rendering when closed', () => {
    it('should render the shade-context-menu custom element', async () => {
      await usingAsync(await renderContextMenu(), async ({ getContextMenu }) => {
        expect(getContextMenu()).not.toBeNull()
        expect(getContextMenu().tagName.toLowerCase()).toBe('shade-context-menu')
      })
    })

    it('should not render menu content when closed', async () => {
      await usingAsync(await renderContextMenu(), async ({ getMenu }) => {
        expect(getMenu()).toBeNull()
      })
    })
  })

  describe('rendering when opened', () => {
    it('should render the menu container when opened', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getMenu }) => {
        manager.open({ items: createTestItems(), position: { x: 100, y: 200 } })
        await sleepAsync(50)

        expect(getMenu()).not.toBeNull()
        expect(getMenu().getAttribute('role')).toBe('menu')
      })
    })

    it('should render menu items', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getMenuItems }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        expect(getMenuItems().length).toBe(3)
      })
    })

    it('should render separators', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getSeparators }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        expect(getSeparators().length).toBe(1)
      })
    })

    it('should render items with menuitem role', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getMenuItems }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        const items = getMenuItems()
        items.forEach((item) => {
          expect(item.getAttribute('role')).toBe('menuitem')
        })
      })
    })

    it('should render a backdrop element', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getBackdrop }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        expect(getBackdrop()).not.toBeNull()
      })
    })

    it('should position the menu at the specified coordinates', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getMenu }) => {
        manager.open({ items: createTestItems(), position: { x: 150, y: 250 } })
        await sleepAsync(50)

        const menu = getMenu()
        expect(menu.style.left).toBe('150px')
        expect(menu.style.top).toBe('250px')
      })
    })
  })

  describe('closing behavior', () => {
    it('should close when backdrop is clicked', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getBackdrop, getMenu }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        expect(getMenu()).not.toBeNull()

        getBackdrop().click()
        await sleepAsync(50)

        expect(manager.isOpened.getValue()).toBe(false)
        expect(getMenu()).toBeNull()
      })
    })

    it('should close when Escape is pressed', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getMenu }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        expect(getMenu()).not.toBeNull()

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await sleepAsync(50)

        expect(manager.isOpened.getValue()).toBe(false)
        expect(getMenu()).toBeNull()
      })
    })

    it('should not close when clicking inside the menu container', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getMenu }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        const menu = getMenu()
        menu.click()
        await sleepAsync(50)

        expect(manager.isOpened.getValue()).toBe(true)
      })
    })
  })

  describe('item selection', () => {
    it('should call onItemSelect when an item is clicked', async () => {
      const onItemSelect = vi.fn()
      await usingAsync(await renderContextMenu({ onItemSelect }), async ({ manager, getMenuItems }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        const items = getMenuItems()
        ;(items[1] as HTMLElement).click()
        await sleepAsync(10)

        expect(onItemSelect).toHaveBeenCalledWith({ id: 2, name: 'Copy' })
      })
    })

    it('should close the menu after item selection', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getMenuItems, getMenu }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        const items = getMenuItems()
        ;(items[0] as HTMLElement).click()
        await sleepAsync(50)

        expect(manager.isOpened.getValue()).toBe(false)
        expect(getMenu()).toBeNull()
      })
    })

    it('should call onItemSelect when Enter is pressed on focused item', async () => {
      const onItemSelect = vi.fn()
      await usingAsync(await renderContextMenu({ onItemSelect }), async ({ manager }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        manager.focusedIndex.setValue(1)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        await sleepAsync(10)

        expect(onItemSelect).toHaveBeenCalledWith({ id: 2, name: 'Copy' })
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should move focus down with ArrowDown', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        expect(manager.focusedIndex.getValue()).toBe(1)
      })
    })

    it('should move focus up with ArrowUp', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        manager.focusedIndex.setValue(1)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))

        expect(manager.focusedIndex.getValue()).toBe(0)
      })
    })

    it('should skip separators during navigation', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        manager.focusedIndex.setValue(1)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        expect(manager.focusedIndex.getValue()).toBe(3)
      })
    })

    it('should add focused class to the focused item', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getMenuItems }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        manager.focusedIndex.setValue(1)
        await sleepAsync(10)

        const items = getMenuItems()
        expect(items[0].hasAttribute('data-focused')).toBe(false)
        expect(items[1].hasAttribute('data-focused')).toBe(true)
        expect(items[2].hasAttribute('data-focused')).toBe(false)
      })
    })

    it('should move focus to Home', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        manager.focusedIndex.setValue(3)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }))

        expect(manager.focusedIndex.getValue()).toBe(0)
      })
    })

    it('should move focus to End', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }))

        expect(manager.focusedIndex.getValue()).toBe(3)
      })
    })
  })

  describe('disabled items', () => {
    it('should not select disabled items on click', async () => {
      const onItemSelect = vi.fn()
      await usingAsync(await renderContextMenu({ onItemSelect }), async ({ manager, getMenuItems }) => {
        manager.open({
          items: [
            { type: 'item', data: { id: 1, name: 'Enabled' }, label: 'Enabled' },
            { type: 'item', data: { id: 2, name: 'Disabled' }, label: 'Disabled', disabled: true },
          ],
          position: { x: 0, y: 0 },
        })
        await sleepAsync(50)

        const items = getMenuItems()
        ;(items[1] as HTMLElement).click()
        await sleepAsync(10)

        expect(onItemSelect).not.toHaveBeenCalled()
      })
    })

    it('should set aria-disabled on disabled items', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getMenuItems }) => {
        manager.open({
          items: [
            { type: 'item', data: { id: 1, name: 'Enabled' }, label: 'Enabled' },
            { type: 'item', data: { id: 2, name: 'Disabled' }, label: 'Disabled', disabled: true },
          ],
          position: { x: 0, y: 0 },
        })
        await sleepAsync(50)

        const items = getMenuItems()
        expect(items[0].getAttribute('aria-disabled')).toBeNull()
        expect(items[1].getAttribute('aria-disabled')).toBe('true')
      })
    })
  })

  describe('keyboard listener cleanup', () => {
    it('should remove keyboard listener when component is disconnected', async () => {
      await usingAsync(await renderContextMenu(), async ({ manager, getContextMenu }) => {
        manager.open({ items: createTestItems(), position: { x: 0, y: 0 } })
        await sleepAsync(50)

        const contextMenu = getContextMenu()
        contextMenu.remove()
        await sleepAsync(10)

        manager.focusedIndex.setValue(0)
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))

        expect(manager.focusedIndex.getValue()).toBe(0)
      })
    })
  })
})
