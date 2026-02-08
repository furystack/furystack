import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, LocationService } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Tabs, type Tab } from './tabs.js'

describe('Tabs', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
    window.location.hash = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
    window.location.hash = ''
  })

  const createTabs = (): Tab[] => [
    {
      hash: 'tab1',
      header: <span>Tab 1</span>,
      component: <div id="content-1">Content 1</div>,
    },
    {
      hash: 'tab2',
      header: <span>Tab 2</span>,
      component: <div id="content-2">Content 2</div>,
    },
    {
      hash: 'tab3',
      header: <span>Tab 3</span>,
      component: <div id="content-3">Content 3</div>,
    },
  ]

  it('should render all tab headers', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const tabs = createTabs()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Tabs tabs={tabs} />,
      })

      await sleepAsync(100)

      expect(document.body.innerHTML).toContain('Tab 1')
      expect(document.body.innerHTML).toContain('Tab 2')
      expect(document.body.innerHTML).toContain('Tab 3')
    })
  })

  it('should display the active tab content based on URL hash', async () => {
    await usingAsync(new Injector(), async (injector) => {
      window.location.hash = '#tab2'

      const rootElement = document.getElementById('root') as HTMLDivElement
      const tabs = createTabs()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Tabs tabs={tabs} />,
      })

      await sleepAsync(100)

      expect(document.getElementById('content-2')).toBeTruthy()
      expect(document.getElementById('content-1')).toBeFalsy()
      expect(document.getElementById('content-3')).toBeFalsy()
    })
  })

  it('should not display any tab content when hash does not match', async () => {
    await usingAsync(new Injector(), async (injector) => {
      window.location.hash = '#nonexistent'

      const rootElement = document.getElementById('root') as HTMLDivElement
      const tabs = createTabs()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Tabs tabs={tabs} />,
      })

      await sleepAsync(100)

      expect(document.getElementById('content-1')).toBeFalsy()
      expect(document.getElementById('content-2')).toBeFalsy()
      expect(document.getElementById('content-3')).toBeFalsy()
    })
  })

  it('should update active tab when hash changes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      window.location.hash = '#tab1'

      const rootElement = document.getElementById('root') as HTMLDivElement
      const tabs = createTabs()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Tabs tabs={tabs} />,
      })

      await sleepAsync(100)

      expect(document.getElementById('content-1')).toBeTruthy()

      // Change hash
      window.location.hash = '#tab3'
      injector.getInstance(LocationService).updateState()

      await sleepAsync(100)

      expect(document.getElementById('content-3')).toBeTruthy()
      expect(document.getElementById('content-1')).toBeFalsy()
    })
  })

  it('should render tab headers as anchor elements with correct href', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const tabs = createTabs()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Tabs tabs={tabs} />,
      })

      await sleepAsync(100)

      // Tab headers extend anchor elements
      const html = document.body.innerHTML
      expect(html).toContain('href="#tab1"')
      expect(html).toContain('href="#tab2"')
      expect(html).toContain('href="#tab3"')
    })
  })

  it('should mark the active tab header with active class', async () => {
    await usingAsync(new Injector(), async (injector) => {
      window.location.hash = '#tab2'

      const rootElement = document.getElementById('root') as HTMLDivElement
      const tabs = createTabs()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Tabs tabs={tabs} />,
      })

      await sleepAsync(100)

      // The tab header with tab2 hash should have active class
      const html = document.body.innerHTML
      // Verify the active tab content is shown
      expect(document.getElementById('content-2')).toBeTruthy()
      // Check for active class in the tab-header element containing Tab 2
      expect(html).toMatch(/shade-tab-header[^>]*class="active"[^>]*href="#tab2"/)
    })
  })

  it('should switch active class when hash changes', async () => {
    await usingAsync(new Injector(), async (injector) => {
      window.location.hash = '#tab1'

      const rootElement = document.getElementById('root') as HTMLDivElement
      const tabs = createTabs()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Tabs tabs={tabs} />,
      })

      await sleepAsync(100)

      // Verify tab1 is active
      expect(document.getElementById('content-1')).toBeTruthy()
      const tab1Header = document.querySelector('a[is="shade-tab-header"][href="#tab1"]') as HTMLElement
      expect(tab1Header?.classList.contains('active')).toBe(true)

      // Change hash
      window.location.hash = '#tab2'
      injector.getInstance(LocationService).updateState()

      await sleepAsync(100)

      // Verify tab2 is now active
      expect(document.getElementById('content-2')).toBeTruthy()
      expect(document.getElementById('content-1')).toBeFalsy()
      // Re-query headers since Shade elements are replaced on re-render
      const tab2Header = document.querySelector('a[is="shade-tab-header"][href="#tab2"]') as HTMLElement
      const tab1HeaderAfter = document.querySelector('a[is="shade-tab-header"][href="#tab1"]') as HTMLElement
      expect(tab2Header?.classList.contains('active')).toBe(true)
      expect(tab1HeaderAfter?.classList.contains('active')).toBe(false)
    })
  })

  it('should apply containerStyle to the element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const tabs = createTabs()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Tabs tabs={tabs} containerStyle={{ maxWidth: '800px' }} />,
      })

      await sleepAsync(100)

      const tabsElement = document.querySelector('shade-tabs') as HTMLElement
      expect(tabsElement.style.maxWidth).toBe('800px')
    })
  })

  it('should work with empty tabs array', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <Tabs tabs={[]} />,
      })

      await sleepAsync(100)

      const tabHeaders = document.querySelectorAll('shade-tab-header')
      expect(tabHeaders.length).toBe(0)
    })
  })

  describe('controlled mode', () => {
    it('should display the active tab based on activeKey', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} activeKey="tab2" />,
        })

        await sleepAsync(100)

        expect(document.getElementById('content-2')).toBeTruthy()
        expect(document.getElementById('content-1')).toBeFalsy()
        expect(document.getElementById('content-3')).toBeFalsy()
      })
    })

    it('should render tab headers as buttons instead of anchors', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} activeKey="tab1" />,
        })

        await sleepAsync(100)

        const buttons = document.querySelectorAll('.shade-tab-btn')
        expect(buttons.length).toBe(3)
        // No anchor-based tab headers in controlled mode
        const anchors = document.querySelectorAll('a[is="shade-tab-header"]')
        expect(anchors.length).toBe(0)
      })
    })

    it('should mark the active tab button with active class', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} activeKey="tab2" />,
        })

        await sleepAsync(100)

        const buttons = document.querySelectorAll('.shade-tab-btn')
        expect(buttons[0].classList.contains('active')).toBe(false)
        expect(buttons[1].classList.contains('active')).toBe(true)
        expect(buttons[2].classList.contains('active')).toBe(false)
      })
    })

    it('should fire onTabChange when a controlled tab is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()
        const onTabChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} activeKey="tab1" onTabChange={onTabChange} />,
        })

        await sleepAsync(100)

        const buttons = document.querySelectorAll('.shade-tab-btn')
        ;(buttons[1] as HTMLButtonElement).click()

        expect(onTabChange).toHaveBeenCalledWith('tab2')
      })
    })

    it('should ignore URL hash when activeKey is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        window.location.hash = '#tab3'

        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} activeKey="tab1" />,
        })

        await sleepAsync(100)

        // activeKey takes precedence over URL hash
        expect(document.getElementById('content-1')).toBeTruthy()
        expect(document.getElementById('content-3')).toBeFalsy()
      })
    })
  })

  describe('type prop', () => {
    it('should set data-type="card" attribute when type is card', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} type="card" />,
        })

        await sleepAsync(100)

        const tabsElement = document.querySelector('shade-tabs') as HTMLElement
        expect(tabsElement.getAttribute('data-type')).toBe('card')
      })
    })

    it('should not set data-type attribute when type is line', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} type="line" />,
        })

        await sleepAsync(100)

        const tabsElement = document.querySelector('shade-tabs') as HTMLElement
        expect(tabsElement.getAttribute('data-type')).toBeNull()
      })
    })
  })

  describe('orientation prop', () => {
    it('should set data-orientation="vertical" attribute', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} orientation="vertical" />,
        })

        await sleepAsync(100)

        const tabsElement = document.querySelector('shade-tabs') as HTMLElement
        expect(tabsElement.getAttribute('data-orientation')).toBe('vertical')
      })
    })

    it('should not set data-orientation attribute when horizontal', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} orientation="horizontal" />,
        })

        await sleepAsync(100)

        const tabsElement = document.querySelector('shade-tabs') as HTMLElement
        expect(tabsElement.getAttribute('data-orientation')).toBeNull()
      })
    })
  })

  describe('closable tabs', () => {
    it('should render close button for closable tabs when onClose is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs: Tab[] = [
          { hash: 'tab1', header: <span>Tab 1</span>, component: <div>Content 1</div>, closable: true },
          { hash: 'tab2', header: <span>Tab 2</span>, component: <div>Content 2</div> },
        ]

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} activeKey="tab1" onClose={() => {}} />,
        })

        await sleepAsync(100)

        const closeButtons = document.querySelectorAll('.shade-tab-close')
        expect(closeButtons.length).toBe(1)
      })
    })

    it('should not render close button when onClose is not provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs: Tab[] = [
          { hash: 'tab1', header: <span>Tab 1</span>, component: <div>Content 1</div>, closable: true },
        ]

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} activeKey="tab1" />,
        })

        await sleepAsync(100)

        const closeButtons = document.querySelectorAll('.shade-tab-close')
        expect(closeButtons.length).toBe(0)
      })
    })

    it('should fire onClose when close button is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onClose = vi.fn()
        const tabs: Tab[] = [
          { hash: 'tab1', header: <span>Tab 1</span>, component: <div>Content 1</div>, closable: true },
          { hash: 'tab2', header: <span>Tab 2</span>, component: <div>Content 2</div>, closable: true },
        ]

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} activeKey="tab1" onClose={onClose} />,
        })

        await sleepAsync(100)

        const closeButtons = document.querySelectorAll('.shade-tab-close')
        ;(closeButtons[1] as HTMLElement).click()

        expect(onClose).toHaveBeenCalledWith('tab2')
      })
    })

    it('should not fire onTabChange when close button is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onClose = vi.fn()
        const onTabChange = vi.fn()
        const tabs: Tab[] = [
          { hash: 'tab1', header: <span>Tab 1</span>, component: <div>Content 1</div>, closable: true },
        ]

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} activeKey="tab1" onClose={onClose} onTabChange={onTabChange} />,
        })

        await sleepAsync(100)

        const closeButton = document.querySelector('.shade-tab-close') as HTMLElement
        closeButton.click()

        expect(onClose).toHaveBeenCalledWith('tab1')
        expect(onTabChange).not.toHaveBeenCalled()
      })
    })
  })

  describe('add button', () => {
    it('should render add button when onAdd is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} onAdd={() => {}} />,
        })

        await sleepAsync(100)

        const addButton = document.querySelector('.shade-tab-add')
        expect(addButton).toBeTruthy()
        expect(addButton?.textContent?.trim()).toBe('+')
      })
    })

    it('should not render add button when onAdd is not provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} />,
        })

        await sleepAsync(100)

        const addButton = document.querySelector('.shade-tab-add')
        expect(addButton).toBeFalsy()
      })
    })

    it('should fire onAdd when add button is clicked', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()
        const onAdd = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} onAdd={onAdd} />,
        })

        await sleepAsync(100)

        const addButton = document.querySelector('.shade-tab-add') as HTMLButtonElement
        addButton.click()

        expect(onAdd).toHaveBeenCalledOnce()
      })
    })
  })

  describe('onTabChange callback (hash mode)', () => {
    it('should fire onTabChange when tab header is clicked in hash mode', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const tabs = createTabs()
        const onTabChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <Tabs tabs={tabs} onTabChange={onTabChange} />,
        })

        await sleepAsync(100)

        const tabHeaders = document.querySelectorAll('a[is="shade-tab-header"]')
        ;(tabHeaders[1] as HTMLElement).click()

        expect(onTabChange).toHaveBeenCalledWith('tab2')
      })
    })
  })
})
