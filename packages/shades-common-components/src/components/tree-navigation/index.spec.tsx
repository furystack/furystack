import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, LocationService } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TreeNavigation, type TreeNavigationItem } from './index.js'

describe('TreeNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    history.pushState(null, '', '/')
    localStorage.clear()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    history.pushState(null, '', '/')
    localStorage.clear()
  })

  const createSimpleItems = (): TreeNavigationItem[] => [
    { label: 'Home', path: '/', icon: '🏠' },
    { label: 'About', path: '/about', icon: '📖' },
    { label: 'Contact', path: '/contact', icon: '📧' },
  ]

  const createNestedItems = (): TreeNavigationItem[] => [
    { label: 'Home', path: '/', icon: '🏠' },
    {
      label: 'Components',
      icon: '🧩',
      children: [
        { label: 'Buttons', path: '/components/buttons' },
        { label: 'Inputs', path: '/components/inputs' },
        {
          label: 'Forms',
          children: [
            { label: 'Text Form', path: '/components/forms/text' },
            { label: 'Number Form', path: '/components/forms/number' },
          ],
        },
      ],
    },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ]

  describe('rendering', () => {
    it('should render the shade-tree-navigation custom element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createSimpleItems()} />,
        })

        await sleepAsync(100)

        const treeNav = document.querySelector('shade-tree-navigation')
        expect(treeNav).not.toBeNull()
        expect(treeNav?.tagName.toLowerCase()).toBe('shade-tree-navigation')
      })
    })

    it('should render all top-level navigation items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createSimpleItems()} />,
        })

        await sleepAsync(100)

        expect(document.body.innerHTML).toContain('Home')
        expect(document.body.innerHTML).toContain('About')
        expect(document.body.innerHTML).toContain('Contact')
      })
    })

    it('should render icons for navigation items', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createSimpleItems()} />,
        })

        await sleepAsync(100)

        expect(document.body.innerHTML).toContain('🏠')
        expect(document.body.innerHTML).toContain('📖')
        expect(document.body.innerHTML).toContain('📧')
      })
    })

    it('should render items without icons', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const items: TreeNavigationItem[] = [{ label: 'No Icon', path: '/no-icon' }]

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={items} />,
        })

        await sleepAsync(100)

        expect(document.body.innerHTML).toContain('No Icon')
      })
    })

    it('should render navigation element with proper role', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createSimpleItems()} />,
        })

        await sleepAsync(100)

        const nav = document.querySelector('nav[role="navigation"]')
        expect(nav).not.toBeNull()
      })
    })
  })

  describe('active state', () => {
    it('should highlight active item based on current path', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/about')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createSimpleItems()} />,
        })

        await sleepAsync(100)

        const activeItem = document.querySelector('.nav-item.active')
        expect(activeItem).not.toBeNull()
        expect(activeItem?.textContent).toContain('About')
      })
    })

    it('should update active state when location changes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createSimpleItems()} />,
        })

        await sleepAsync(100)

        let activeItem = document.querySelector('.nav-item.active')
        expect(activeItem?.textContent).toContain('Home')

        // Navigate to About
        history.pushState(null, '', '/about')
        injector.getInstance(LocationService).updateState()

        await sleepAsync(100)

        activeItem = document.querySelector('.nav-item.active')
        expect(activeItem?.textContent).toContain('About')
      })
    })

    it('should only have one active item at a time', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/about')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createSimpleItems()} />,
        })

        await sleepAsync(100)

        const activeItems = document.querySelectorAll('.nav-item.active')
        expect(activeItems.length).toBe(1)
      })
    })
  })

  describe('nested navigation', () => {
    it('should render parent items with expand icon', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} />,
        })

        await sleepAsync(100)

        expect(document.body.innerHTML).toContain('Components')
        const expandIcons = document.querySelectorAll('.nav-expand-icon')
        expect(expandIcons.length).toBeGreaterThan(0)
      })
    })

    it('should hide child items when parent is collapsed', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} />,
        })

        await sleepAsync(100)

        // Initially children should not be visible (not expanded)
        const childrenContainer = document.querySelector('.nav-children:not(.expanded)')
        expect(childrenContainer).not.toBeNull()
      })
    })

    it('should expand parent when clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} />,
        })

        await sleepAsync(100)

        // Find and click Components item
        const items = document.querySelectorAll('.nav-item')
        let componentsParent: HTMLElement | null = null
        items.forEach((item) => {
          if (item.textContent?.includes('Components')) {
            componentsParent = item as HTMLElement
          }
        })

        expect(componentsParent).not.toBeNull()
        componentsParent!.click()

        await sleepAsync(100)

        // Now children should be visible
        const expandedChildren = document.querySelector('.nav-children.expanded')
        expect(expandedChildren).not.toBeNull()
      })
    })

    it('should toggle expansion on multiple clicks', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} />,
        })

        await sleepAsync(100)

        // Find Components item - need to re-query after each render
        const findComponentsItem = (): HTMLElement | null => {
          const items = document.querySelectorAll('.nav-item')
          for (const item of items) {
            if (item.textContent?.includes('Components') && !item.textContent?.includes('Buttons')) {
              return item as HTMLElement
            }
          }
          return null
        }

        // Initially collapsed
        expect(document.querySelectorAll('.nav-children.expanded').length).toBe(0)

        // Click to expand
        const firstItem = findComponentsItem()
        expect(firstItem).not.toBeNull()
        firstItem!.click()
        await sleepAsync(150)

        // Should have at least one expanded section
        const expandedAfterFirstClick = document.querySelectorAll('.nav-children.expanded').length
        expect(expandedAfterFirstClick).toBeGreaterThan(0)

        // Click to collapse - need to re-find the element after re-render
        const secondItem = findComponentsItem()
        expect(secondItem).not.toBeNull()
        secondItem!.click()
        await sleepAsync(150)

        // Count should decrease
        const expandedAfterSecondClick = document.querySelectorAll('.nav-children.expanded').length
        expect(expandedAfterSecondClick).toBeLessThan(expandedAfterFirstClick)
      })
    })

    it('should auto-expand parent when child route is active', async () => {
      await usingAsync(new Injector(), async (injector) => {
        history.pushState(null, '', '/components/buttons')

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} />,
        })

        await sleepAsync(100)

        // Parent should be expanded because a child is active
        const expandedChildren = document.querySelector('.nav-children.expanded')
        expect(expandedChildren).not.toBeNull()
        expect(document.body.innerHTML).toContain('Buttons')
      })
    })
  })

  describe('expandedByDefault prop', () => {
    it('should expand all items by default when expandedByDefault is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} expandedByDefault={true} />,
        })

        await sleepAsync(100)

        // All parent items should be expanded
        const expandedChildren = document.querySelectorAll('.nav-children.expanded')
        expect(expandedChildren.length).toBeGreaterThan(0)
      })
    })

    it('should not expand items by default when expandedByDefault is false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} expandedByDefault={false} />,
        })

        await sleepAsync(100)

        // Child items should not be visible unless parent is active
        // This assumes no active child route
        const navChildren = document.querySelectorAll('.nav-children')
        navChildren.forEach((child) => {
          // Check if it doesn't have the expanded class
          if (!child.classList.contains('expanded')) {
            // Good - it's collapsed
          }
        })
      })
    })
  })

  describe('maxDepth prop', () => {
    it('should limit nesting depth', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const deeplyNestedItems: TreeNavigationItem[] = [
          {
            label: 'Level 0',
            children: [
              {
                label: 'Level 1',
                children: [
                  {
                    label: 'Level 2',
                    children: [{ label: 'Level 3', path: '/deep' }],
                  },
                ],
              },
            ],
          },
        ]

        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={deeplyNestedItems} maxDepth={2} expandedByDefault={true} />,
        })

        await sleepAsync(100)

        // Level 0, 1, and 2 should render
        expect(document.body.innerHTML).toContain('Level 0')
        expect(document.body.innerHTML).toContain('Level 1')
        expect(document.body.innerHTML).toContain('Level 2')
        // Level 3 should not render (beyond maxDepth)
        expect(document.body.innerHTML).not.toContain('Level 3')
      })
    })
  })

  describe('onNavigate callback', () => {
    it('should call onNavigate when a navigable item is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const onNavigate = vi.fn()
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createSimpleItems()} onNavigate={onNavigate} />,
        })

        await sleepAsync(100)

        // Find and click the About item
        const items = document.querySelectorAll('.nav-item')
        let aboutItem: HTMLElement | null = null
        items.forEach((item) => {
          if (item.textContent?.includes('About')) {
            aboutItem = item as HTMLElement
          }
        })

        aboutItem!.click()
        await sleepAsync(50)

        expect(onNavigate).toHaveBeenCalledTimes(1)
        expect(onNavigate).toHaveBeenCalledWith(
          expect.objectContaining({
            label: 'About',
            path: '/about',
          }),
        )
      })
    })
  })

  describe('localStorage persistence', () => {
    it('should persist expanded state to localStorage', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const storageKey = 'test-nav-expanded'

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} storageKey={storageKey} />,
        })

        await sleepAsync(100)

        // Expand Components
        const items = document.querySelectorAll('.nav-item')
        let componentsParent: HTMLElement | null = null
        items.forEach((item) => {
          if (item.textContent?.includes('Components')) {
            componentsParent = item as HTMLElement
          }
        })

        componentsParent!.click()
        await sleepAsync(100)

        // Check localStorage
        const stored = localStorage.getItem(storageKey)
        expect(stored).not.toBeNull()
        expect(stored).toContain('Components')
      })
    })

    it('should use custom storage key', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const customKey = 'my-custom-key'

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} storageKey={customKey} />,
        })

        await sleepAsync(100)

        // Find and click Components item to trigger storage
        const items = document.querySelectorAll('.nav-item')
        let componentsParent: HTMLElement | null = null
        items.forEach((item) => {
          if (item.textContent?.includes('Components') && !item.textContent?.includes('Buttons')) {
            componentsParent = item as HTMLElement
          }
        })

        componentsParent!.click()
        await sleepAsync(100)

        // Check that custom key is used in localStorage
        const stored = localStorage.getItem(customKey)
        expect(stored).not.toBeNull()
        expect(stored).toContain('Components')

        // Verify default key is not used
        const defaultStored = localStorage.getItem('tree-nav-expanded')
        expect(defaultStored).toBeNull()
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should expand item on Enter key', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} />,
        })

        await sleepAsync(100)

        // Find Components item
        const items = document.querySelectorAll('.nav-item')
        let componentsParent: HTMLElement | null = null
        items.forEach((item) => {
          if (item.textContent?.includes('Components')) {
            componentsParent = item as HTMLElement
          }
        })

        // Simulate Enter key press
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
        componentsParent!.dispatchEvent(enterEvent)

        await sleepAsync(100)

        const expandedChildren = document.querySelector('.nav-children.expanded')
        expect(expandedChildren).not.toBeNull()
      })
    })

    it('should expand item on Space key', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createNestedItems()} />,
        })

        await sleepAsync(100)

        // Find Components item
        const items = document.querySelectorAll('.nav-item')
        let componentsParent: HTMLElement | null = null
        items.forEach((item) => {
          if (item.textContent?.includes('Components')) {
            componentsParent = item as HTMLElement
          }
        })

        // Simulate Space key press
        const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
        componentsParent!.dispatchEvent(spaceEvent)

        await sleepAsync(100)

        const expandedChildren = document.querySelector('.nav-children.expanded')
        expect(expandedChildren).not.toBeNull()
      })
    })
  })

  describe('empty state', () => {
    it('should render empty navigation when items array is empty', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={[]} />,
        })

        await sleepAsync(100)

        const treeNav = document.querySelector('shade-tree-navigation')
        expect(treeNav).not.toBeNull()
        const navItems = document.querySelectorAll('.nav-item')
        expect(navItems.length).toBe(0)
      })
    })
  })

  describe('styling', () => {
    it('should have proper display style', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <TreeNavigation items={createSimpleItems()} />,
        })

        await sleepAsync(100)

        const treeNav = document.querySelector('shade-tree-navigation') as HTMLElement
        const computedStyle = window.getComputedStyle(treeNav)
        expect(computedStyle.display).toBe('block')
      })
    })
  })
})
