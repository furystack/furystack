import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PageHeader } from './page-header.js'

describe('PageHeader component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('should render the shade-page-header custom element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader title="Test Title" />,
        })

        await flushUpdates()
        const element = document.querySelector('shade-page-header')
        expect(element).not.toBeNull()
        expect(element?.tagName.toLowerCase()).toBe('shade-page-header')
      })
    })

    it('should render the title', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader title="Users" />,
        })

        await flushUpdates()
        const title = document.querySelector('[data-testid="page-header-title"]')
        expect(title).not.toBeNull()
        expect(title?.textContent).toBe('Users')
      })
    })

    it('should render the title as h2', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader title="Dashboard" />,
        })

        await flushUpdates()
        const title = document.querySelector('[data-testid="page-header-title"]')
        expect(title?.tagName.toLowerCase()).toBe('h2')
      })
    })
  })

  describe('icon', () => {
    it('should render icon when provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader icon="👥" title="Users" />,
        })

        await flushUpdates()
        const icon = document.querySelector('.page-header-icon')
        expect(icon).not.toBeNull()
        expect(icon?.textContent).toBe('👥')
      })
    })

    it('should not render icon element when not provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader title="Users" />,
        })

        await flushUpdates()
        const icon = document.querySelector('.page-header-icon')
        expect(icon).toBeNull()
      })
    })

    it('should include icon in title text', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader icon="📁" title="Projects" />,
        })

        await flushUpdates()
        const title = document.querySelector('[data-testid="page-header-title"]')
        expect(title?.textContent).toContain('📁')
        expect(title?.textContent).toContain('Projects')
      })
    })
  })

  describe('description', () => {
    it('should render description when provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader title="Users" description="Manage user accounts." />,
        })

        await flushUpdates()
        const description = document.querySelector('[data-testid="page-header-description"]')
        expect(description).not.toBeNull()
        expect(description?.textContent).toBe('Manage user accounts.')
      })
    })

    it('should not render description element when not provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader title="Users" />,
        })

        await flushUpdates()
        const description = document.querySelector('[data-testid="page-header-description"]')
        expect(description).toBeNull()
      })
    })

    it('should render description as p element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader title="Dashboard" description="Overview of your data." />,
        })

        await flushUpdates()
        const description = document.querySelector('[data-testid="page-header-description"]')
        expect(description?.tagName.toLowerCase()).toBe('p')
      })
    })
  })

  describe('actions', () => {
    it('should render actions when provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageHeader
              title="Users"
              actions={
                <button type="button" data-testid="action-button">
                  Add User
                </button>
              }
            />
          ),
        })

        await flushUpdates()
        const actionsContainer = document.querySelector('[data-testid="page-header-actions"]')
        expect(actionsContainer).not.toBeNull()

        const actionButton = document.querySelector('[data-testid="action-button"]')
        expect(actionButton).not.toBeNull()
        expect(actionButton?.textContent).toBe('Add User')
      })
    })

    it('should not render actions element when not provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageHeader title="Users" />,
        })

        await flushUpdates()
        const actionsContainer = document.querySelector('[data-testid="page-header-actions"]')
        expect(actionsContainer).toBeNull()
      })
    })

    it('should render multiple action elements', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageHeader
              title="Users"
              actions={
                <>
                  <button type="button">Export</button>
                  <button type="button">Add User</button>
                </>
              }
            />
          ),
        })

        await flushUpdates()
        const actionsContainer = document.querySelector('[data-testid="page-header-actions"]')
        const buttons = actionsContainer?.querySelectorAll('button')
        expect(buttons?.length).toBe(2)
      })
    })
  })

  describe('combined props', () => {
    it('should render all props together', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageHeader
              icon="👥"
              title="Users"
              description="Manage user accounts and their roles."
              actions={<button type="button">Add User</button>}
            />
          ),
        })

        await flushUpdates()

        const icon = document.querySelector('.page-header-icon')
        expect(icon?.textContent).toBe('👥')

        const title = document.querySelector('[data-testid="page-header-title"]')
        expect(title?.textContent).toContain('Users')

        const description = document.querySelector('[data-testid="page-header-description"]')
        expect(description?.textContent).toBe('Manage user accounts and their roles.')

        const actionsContainer = document.querySelector('[data-testid="page-header-actions"]')
        expect(actionsContainer?.querySelector('button')).not.toBeNull()
      })
    })

    it('should work with PageContainer integration', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const { PageContainer } = await import('./index.js')

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageContainer maxWidth="800px" centered>
              <PageHeader icon="📊" title="Dashboard" description="Your data overview." />
              <div>Content area</div>
            </PageContainer>
          ),
        })

        await flushUpdates()
        await flushUpdates()

        const container = document.querySelector('div[is="shade-page-container"]')
        expect(container).not.toBeNull()

        const header = document.querySelector('shade-page-header')
        expect(header).not.toBeNull()

        const title = document.querySelector('[data-testid="page-header-title"]')
        expect(title?.textContent).toContain('Dashboard')
      })
    })
  })
})
