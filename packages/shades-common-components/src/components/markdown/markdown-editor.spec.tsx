import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MarkdownEditor } from './markdown-editor.js'

describe('MarkdownEditor', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('should render with shadow DOM', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownEditor value="# Hello" />,
      })

      await sleepAsync(50)

      const el = document.querySelector('shade-markdown-editor')
      expect(el).not.toBeNull()
    })
  })

  describe('side-by-side layout (default)', () => {
    it('should render input and preview panes side by side', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="# Hello" />,
        })

        await sleepAsync(50)

        const split = document.querySelector('.md-editor-split') as HTMLElement
        expect(split).not.toBeNull()
        expect(split.dataset.layout).toBe('side-by-side')

        const input = document.querySelector('shade-markdown-editor shade-markdown-input')
        expect(input).not.toBeNull()

        const display = document.querySelector('shade-markdown-editor shade-markdown-display')
        expect(display).not.toBeNull()
      })
    })
  })

  describe('above-below layout', () => {
    it('should render with above-below layout', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="# Hello" layout="above-below" />,
        })

        await sleepAsync(50)

        const split = document.querySelector('.md-editor-split') as HTMLElement
        expect(split).not.toBeNull()
        expect(split.dataset.layout).toBe('above-below')
      })
    })
  })

  describe('tabs layout', () => {
    it('should render with tabs layout', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="# Hello" layout="tabs" />,
        })

        await sleepAsync(50)

        const tabs = document.querySelector('shade-markdown-editor shade-tabs')
        expect(tabs).not.toBeNull()

        const tabButtons = document.querySelectorAll('shade-markdown-editor .shade-tab-btn')
        expect(tabButtons.length).toBe(2)
      })
    })

    it('should show the edit tab by default', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="# Hello" layout="tabs" />,
        })

        await sleepAsync(50)

        const input = document.querySelector('shade-markdown-editor shade-markdown-input')
        expect(input).not.toBeNull()
      })
    })
  })

  it('should pass value to both input and display', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const mdContent = '# Test Content'

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownEditor value={mdContent} />,
      })

      await sleepAsync(50)

      const textarea = document.querySelector('shade-markdown-editor textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe(mdContent)

      const heading = document.querySelector(
        'shade-markdown-editor shade-markdown-display shade-typography[data-variant="h1"]',
      )
      expect(heading).not.toBeNull()
      expect(heading?.textContent).toContain('Test Content')
    })
  })
})
