import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot, LocationService } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
      expect(document.body.innerHTML).toMatch(/shade-tab-header[^>]*class="active"[^>]*href="#tab1"/)

      // Change hash
      window.location.hash = '#tab2'
      injector.getInstance(LocationService).updateState()

      await sleepAsync(100)

      // Verify tab2 is now active
      expect(document.getElementById('content-2')).toBeTruthy()
      expect(document.getElementById('content-1')).toBeFalsy()
      expect(document.body.innerHTML).toMatch(/shade-tab-header[^>]*class="active"[^>]*href="#tab2"/)
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
})
