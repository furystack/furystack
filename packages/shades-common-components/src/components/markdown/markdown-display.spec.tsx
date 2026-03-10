import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MarkdownDisplay } from './markdown-display.js'

describe('MarkdownDisplay', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('should render as custom element', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="Hello" />,
      })

      await flushUpdates()

      const el = document.querySelector('shade-markdown-display')
      expect(el).not.toBeNull()
    })
  })

  it('should render a heading', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="# Hello World" />,
      })

      await flushUpdates()

      const typography = document.querySelector('shade-markdown-display [is^="shade-typography"]')
      expect(typography).not.toBeNull()
      expect(typography?.getAttribute('data-variant')).toBe('h1')
      expect(typography?.textContent).toContain('Hello World')
    })
  })

  it('should render a paragraph', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="Just a paragraph." />,
      })

      await flushUpdates()

      const typography = document.querySelector('shade-markdown-display [is^="shade-typography"][data-variant="body1"]')
      expect(typography).not.toBeNull()
      expect(typography?.textContent).toContain('Just a paragraph.')
    })
  })

  it('should render a code block', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content={'```js\nconsole.log("hi")\n```'} />,
      })

      await flushUpdates()

      const codeBlock = document.querySelector('shade-markdown-display .md-code-block')
      expect(codeBlock).not.toBeNull()
      expect(codeBlock?.textContent).toContain('console.log("hi")')
    })
  })

  it('should render a list', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content={'- Item A\n- Item B'} />,
      })

      await flushUpdates()

      const list = document.querySelector('shade-markdown-display ul')
      expect(list).not.toBeNull()
      const items = document.querySelectorAll('shade-markdown-display .md-list-item')
      expect(items.length).toBe(2)
    })
  })

  it('should render checkboxes as disabled when readOnly (default)', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="- [ ] Task" />,
      })

      await flushUpdates()

      const checkbox = document.querySelector('shade-markdown-display shade-checkbox')
      expect(checkbox).not.toBeNull()
      expect(checkbox?.hasAttribute('data-disabled')).toBe(true)
    })
  })

  it('should render checkboxes as enabled when readOnly is false', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="- [ ] Task" readOnly={false} onChange={onChange} />,
      })

      await flushUpdates()

      const checkbox = document.querySelector('shade-markdown-display shade-checkbox')
      expect(checkbox).not.toBeNull()
      expect(checkbox?.hasAttribute('data-disabled')).toBe(false)

      const input = checkbox?.querySelector('input[type="checkbox"]') as HTMLInputElement
      expect(input).not.toBeNull()
      input.click()

      await flushUpdates()

      expect(onChange).toHaveBeenCalledOnce()
      expect(onChange).toHaveBeenCalledWith('- [x] Task')
    })
  })

  it('should render a blockquote', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="> Quote text" />,
      })

      await flushUpdates()

      const bq = document.querySelector('shade-markdown-display .md-blockquote')
      expect(bq).not.toBeNull()
      expect(bq?.textContent).toContain('Quote text')
    })
  })

  it('should render a horizontal rule', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="---" />,
      })

      await flushUpdates()

      const hr = document.querySelector('shade-markdown-display .md-hr')
      expect(hr).not.toBeNull()
    })
  })

  it('should render links', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="[Click here](https://example.com)" />,
      })

      await flushUpdates()

      const link = document.querySelector('shade-markdown-display .md-link') as HTMLAnchorElement
      expect(link).not.toBeNull()
      expect(link?.href).toContain('example.com')
      expect(link?.textContent).toContain('Click here')
    })
  })

  it('should render images', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="![alt text](image.png)" />,
      })

      await flushUpdates()

      const img = document.querySelector('shade-markdown-display .md-image') as HTMLImageElement
      expect(img).not.toBeNull()
      expect(img?.alt).toBe('alt text')
    })
  })

  it('should render empty for empty content', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownDisplay content="" />,
      })

      await flushUpdates()

      const root = document.querySelector('shade-markdown-display .md-root')
      expect(root).not.toBeNull()
      expect(root?.children.length).toBe(0)
    })
  })

  describe('keyboard navigation', () => {
    it('should make links focusable', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownDisplay content="[Link A](https://a.com) and [Link B](https://b.com)" />,
        })

        await flushUpdates()

        const links = document.querySelectorAll<HTMLAnchorElement>('shade-markdown-display .md-link')
        expect(links.length).toBe(2)

        links[0].focus()
        expect(document.activeElement).toBe(links[0])

        links[1].focus()
        expect(document.activeElement).toBe(links[1])
      })
    })

    it('should make code blocks focusable via tabIndex', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownDisplay content={'```js\nconsole.log("hi")\n```'} />,
        })

        await flushUpdates()

        const codeBlock = document.querySelector('shade-markdown-display .md-code-block') as HTMLPreElement
        expect(codeBlock).not.toBeNull()
        expect(codeBlock.tabIndex).toBe(0)

        codeBlock.focus()
        expect(document.activeElement).toBe(codeBlock)
      })
    })

    it('should make checkbox inputs focusable when not disabled', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownDisplay content={'- [ ] Task A\n- [ ] Task B'} readOnly={false} onChange={() => {}} />,
        })

        await flushUpdates()

        const checkboxes = document.querySelectorAll<HTMLInputElement>(
          'shade-markdown-display shade-checkbox input[type="checkbox"]',
        )
        expect(checkboxes.length).toBe(2)

        checkboxes[0].focus()
        expect(document.activeElement).toBe(checkboxes[0])
        expect(checkboxes[0].disabled).toBe(false)
      })
    })

    it('should toggle checkbox via keyboard activation', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownDisplay content="- [ ] My Task" readOnly={false} onChange={onChange} />,
        })

        await flushUpdates()

        const input = document.querySelector(
          'shade-markdown-display shade-checkbox input[type="checkbox"]',
        ) as HTMLInputElement
        expect(input).not.toBeNull()

        input.focus()
        expect(document.activeElement).toBe(input)

        input.click()
        await flushUpdates()

        expect(onChange).toHaveBeenCalledOnce()
        expect(onChange).toHaveBeenCalledWith('- [x] My Task')
      })
    })

    it('should have correct focus order for mixed interactive elements', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        const content = [
          '[First link](https://first.com)',
          '',
          '```js',
          'code()',
          '```',
          '',
          '[Second link](https://second.com)',
        ].join('\n')

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownDisplay content={content} />,
        })

        await flushUpdates()

        const focusableElements = document.querySelectorAll(
          'shade-markdown-display a[href], shade-markdown-display [tabindex="0"]',
        )
        expect(focusableElements.length).toBe(3)

        const [firstLink, codeBlock, secondLink] = focusableElements
        expect(firstLink.tagName).toBe('A')
        expect(codeBlock.tagName).toBe('PRE')
        expect(secondLink.tagName).toBe('A')
      })
    })
  })
})
