import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PageContainer } from './index.js'

describe('PageContainer component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('should render the shade-page-container custom element', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer>Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]')
        expect(element).not.toBeNull()
        expect(element?.tagName.toLowerCase()).toBe('div')
        expect(element?.getAttribute('is')).toBe('shade-page-container')
      })
    })

    it('should render children', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageContainer>
              <span>Child content</span>
            </PageContainer>
          ),
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]')
        expect(element?.textContent).toContain('Child content')
      })
    })

    it('should render multiple children', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageContainer>
              <span>First</span>
              <span>Second</span>
            </PageContainer>
          ),
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]')
        expect(element?.textContent).toContain('First')
        expect(element?.textContent).toContain('Second')
      })
    })
  })

  describe('default styling', () => {
    it('should apply default padding of 24px', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer>Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.padding).toBe('24px')
      })
    })

    it('should apply default gap of 24px', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer>Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.gap).toBe('24px')
      })
    })

    it('should apply default maxWidth of 100%', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer>Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.maxWidth).toBe('100%')
      })
    })

    it('should apply full height by default', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer>Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.height).toBe('100%')
      })
    })

    it('should not center by default', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer>Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.marginLeft).toBe('')
        expect(element.style.marginRight).toBe('')
      })
    })
  })

  describe('custom props', () => {
    it('should apply custom maxWidth', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer maxWidth="800px">Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.maxWidth).toBe('800px')
      })
    })

    it('should apply custom padding', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer padding="48px">Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.padding).toBe('48px')
      })
    })

    it('should apply custom gap', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer gap="16px">Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.gap).toBe('16px')
      })
    })

    it('should center when centered prop is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageContainer centered maxWidth="600px">
              Content
            </PageContainer>
          ),
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.marginLeft).toBe('auto')
        expect(element.style.marginRight).toBe('auto')
      })
    })

    it('should apply auto height when fullHeight is false', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <PageContainer fullHeight={false}>Content</PageContainer>,
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.height).toBe('auto')
      })
    })
  })

  describe('combined props', () => {
    it('should apply all custom props together', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <PageContainer maxWidth="800px" centered padding="48px" gap="32px" fullHeight={false}>
              Content
            </PageContainer>
          ),
        })

        await sleepAsync(50)
        const element = document.querySelector('div[is="shade-page-container"]') as HTMLDivElement
        expect(element.style.maxWidth).toBe('800px')
        expect(element.style.marginLeft).toBe('auto')
        expect(element.style.marginRight).toBe('auto')
        expect(element.style.padding).toBe('48px')
        expect(element.style.gap).toBe('32px')
        expect(element.style.height).toBe('auto')
      })
    })
  })
})
