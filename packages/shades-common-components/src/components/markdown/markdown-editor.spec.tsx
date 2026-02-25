import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
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

      await flushUpdates()

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

        await flushUpdates()

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

        await flushUpdates()

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

        await flushUpdates()

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

        await flushUpdates()

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

      await flushUpdates()

      const textarea = document.querySelector('shade-markdown-editor textarea') as HTMLTextAreaElement
      expect(textarea.value).toBe(mdContent)

      const heading = document.querySelector(
        'shade-markdown-editor shade-markdown-display [is^="shade-typography"][data-variant="h1"]',
      )
      expect(heading).not.toBeNull()
      expect(heading?.textContent).toContain('Test Content')
    })
  })

  describe('form integration', () => {
    it('should render a label when labelTitle is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" labelTitle="Description" />,
        })

        await flushUpdates()

        const label = document.querySelector('shade-markdown-editor .md-editor-label')
        expect(label).not.toBeNull()
        expect(label?.textContent).toBe('Description')
      })
    })

    it('should not render a label when labelTitle is not provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" />,
        })

        await flushUpdates()

        const label = document.querySelector('shade-markdown-editor .md-editor-label')
        expect(label).toBeNull()
      })
    })

    it('should set data-invalid when required and value is empty', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" required />,
        })

        await flushUpdates()

        const editor = document.querySelector('shade-markdown-editor') as HTMLElement
        expect(editor.hasAttribute('data-invalid')).toBe(true)
      })
    })

    it('should not set data-invalid when required and value is provided', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="some content" required />,
        })

        await flushUpdates()

        const editor = document.querySelector('shade-markdown-editor') as HTMLElement
        expect(editor.hasAttribute('data-invalid')).toBe(false)
      })
    })

    it('should show "Value is required" helper text when required and empty', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" required />,
        })

        await flushUpdates()

        const helperText = document.querySelector('shade-markdown-editor .md-editor-helperText')
        expect(helperText).not.toBeNull()
        expect(helperText?.textContent).toBe('Value is required')
      })
    })

    it('should set data-invalid when getValidationResult returns invalid', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <MarkdownEditor
              value="short"
              getValidationResult={({ value }) =>
                value.length < 10 ? { isValid: false, message: 'Too short' } : { isValid: true }
              }
            />
          ),
        })

        await flushUpdates()

        const editor = document.querySelector('shade-markdown-editor') as HTMLElement
        expect(editor.hasAttribute('data-invalid')).toBe(true)
        expect(editor.textContent).toContain('Too short')
      })
    })

    it('should not set data-invalid when getValidationResult returns valid', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <MarkdownEditor
              value="long enough content"
              getValidationResult={({ value }) =>
                value.length < 10 ? { isValid: false, message: 'Too short' } : { isValid: true }
              }
            />
          ),
        })

        await flushUpdates()

        const editor = document.querySelector('shade-markdown-editor') as HTMLElement
        expect(editor.hasAttribute('data-invalid')).toBe(false)
      })
    })

    it('should display helper text from getHelperText', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" getHelperText={() => 'Enter your description'} />,
        })

        await flushUpdates()

        const helperText = document.querySelector('shade-markdown-editor .md-editor-helperText')
        expect(helperText).not.toBeNull()
        expect(helperText?.textContent).toBe('Enter your description')
      })
    })

    it('should forward name prop to the inner textarea', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" name="description" />,
        })

        await flushUpdates()

        const textarea = document.querySelector('shade-markdown-editor textarea') as HTMLTextAreaElement
        expect(textarea.name).toBe('description')
      })
    })

    it('should forward required prop to the inner textarea', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="content" required />,
        })

        await flushUpdates()

        const textarea = document.querySelector('shade-markdown-editor textarea') as HTMLTextAreaElement
        expect(textarea.required).toBe(true)
      })
    })

    it('should forward disabled prop to the inner textarea', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" disabled />,
        })

        await flushUpdates()

        const textarea = document.querySelector('shade-markdown-editor textarea') as HTMLTextAreaElement
        expect(textarea.disabled).toBe(true)
      })
    })

    it('should forward placeholder prop to the inner textarea', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" placeholder="Type here..." />,
        })

        await flushUpdates()

        const textarea = document.querySelector('shade-markdown-editor textarea') as HTMLTextAreaElement
        expect(textarea.placeholder).toBe('Type here...')
      })
    })

    it('should forward rows prop to the inner textarea', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" rows={5} />,
        })

        await flushUpdates()

        const textarea = document.querySelector('shade-markdown-editor textarea') as HTMLTextAreaElement
        expect(textarea.rows).toBe(5)
      })
    })

    it('should set hideChrome on the inner MarkdownInput', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownEditor value="" labelTitle="My Label" />,
        })

        await flushUpdates()

        const editorLabel = document.querySelector('shade-markdown-editor .md-editor-label')
        expect(editorLabel?.textContent).toBe('My Label')

        const inputLabel = document.querySelector('shade-markdown-editor shade-markdown-input label > span')
        expect(inputLabel).toBeNull()
      })
    })
  })
})
