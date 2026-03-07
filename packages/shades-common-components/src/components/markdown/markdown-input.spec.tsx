import { Injector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Form } from '../form.js'
import { MarkdownInput } from './markdown-input.js'

describe('MarkdownInput', () => {
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
        jsxElement: <MarkdownInput value="" />,
      })

      await flushUpdates()

      const el = document.querySelector('shade-markdown-input')
      expect(el).not.toBeNull()
    })
  })

  it('should render a textarea with the given value', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="# Hello" />,
      })

      await flushUpdates()

      const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
      expect(textarea).not.toBeNull()
      expect(textarea.value).toBe('# Hello')
    })
  })

  it('should render the label title', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" labelTitle="Markdown Content" />,
      })

      await flushUpdates()

      const label = document.querySelector('shade-markdown-input label')
      expect(label?.textContent).toContain('Markdown Content')
    })
  })

  it('should set placeholder on textarea', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" placeholder="Type markdown..." />,
      })

      await flushUpdates()

      const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
      expect(textarea.placeholder).toBe('Type markdown...')
    })
  })

  it('should set data-disabled when disabled', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" disabled />,
      })

      await flushUpdates()

      const wrapper = document.querySelector('shade-markdown-input') as HTMLElement
      expect(wrapper.hasAttribute('data-disabled')).toBe(true)

      const textarea = wrapper.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.disabled).toBe(true)
    })
  })

  it('should set readOnly on textarea', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" readOnly />,
      })

      await flushUpdates()

      const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
      expect(textarea.readOnly).toBe(true)
    })
  })

  it('should call onValueChange on input event', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement
      const onValueChange = vi.fn()

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" onValueChange={onValueChange} />,
      })

      await flushUpdates()

      const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
      textarea.value = '# New content'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))

      await flushUpdates()

      expect(onValueChange).toHaveBeenCalledWith('# New content')
    })
  })

  it('should use custom rows prop', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" rows={20} />,
      })

      await flushUpdates()

      const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
      expect(textarea.rows).toBe(20)
    })
  })

  it('should set name attribute on textarea', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" name="description" />,
      })

      await flushUpdates()

      const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
      expect(textarea.name).toBe('description')
    })
  })

  it('should set required attribute on textarea', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" required />,
      })

      await flushUpdates()

      const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
      expect(textarea.required).toBe(true)
    })
  })

  it('should set data-invalid when required and value is empty', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" required />,
      })

      await flushUpdates()

      const wrapper = document.querySelector('shade-markdown-input') as HTMLElement
      expect(wrapper.hasAttribute('data-invalid')).toBe(true)
    })
  })

  it('should not set data-invalid when required and value is provided', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="some content" required />,
      })

      await flushUpdates()

      const wrapper = document.querySelector('shade-markdown-input') as HTMLElement
      expect(wrapper.hasAttribute('data-invalid')).toBe(false)
    })
  })

  it('should show validation error message from getValidationResult', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <MarkdownInput
            value="short"
            getValidationResult={({ value }) =>
              value.length < 10 ? { isValid: false, message: 'Too short' } : { isValid: true }
            }
          />
        ),
      })

      await flushUpdates()

      const wrapper = document.querySelector('shade-markdown-input') as HTMLElement
      expect(wrapper.hasAttribute('data-invalid')).toBe(true)
      expect(wrapper.textContent).toContain('Too short')
    })
  })

  it('should show helper text from getHelperText', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <MarkdownInput value="" getHelperText={() => 'Write some markdown here'} />,
      })

      await flushUpdates()

      const wrapper = document.querySelector('shade-markdown-input') as HTMLElement
      expect(wrapper.textContent).toContain('Write some markdown here')
    })
  })

  describe('hideChrome', () => {
    it('should suppress the label when hideChrome is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownInput value="" labelTitle="My Label" hideChrome />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-markdown-input') as HTMLElement
        const spans = wrapper.querySelectorAll('label > span')
        const labelSpan = Array.from(spans).find((s) => s.textContent === 'My Label')
        expect(labelSpan).toBeUndefined()
      })
    })

    it('should suppress the helper text when hideChrome is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: (
            <MarkdownInput
              value="short"
              hideChrome
              getValidationResult={({ value }) =>
                value.length < 10 ? { isValid: false, message: 'Too short' } : { isValid: true }
              }
            />
          ),
        })

        await flushUpdates()

        const helperText = document.querySelector('shade-markdown-input .helperText')
        expect(helperText).toBeNull()
      })
    })

    it('should still set data-invalid when hideChrome is true', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownInput value="" required hideChrome />,
        })

        await flushUpdates()

        const wrapper = document.querySelector('shade-markdown-input') as HTMLElement
        expect(wrapper.hasAttribute('data-invalid')).toBe(true)
      })
    })
  })

  it('should render with validation inside a Form', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: (
          <Form onSubmit={() => {}} validate={(_data): _data is { content: string } => true}>
            <MarkdownInput
              value="short"
              name="content"
              getValidationResult={({ value }) =>
                value.length < 10 ? { isValid: false, message: 'Too short' } : { isValid: true }
              }
            />
          </Form>
        ),
      })

      await flushUpdates()

      const wrapper = document.querySelector('shade-markdown-input') as HTMLElement
      expect(wrapper.hasAttribute('data-invalid')).toBe(true)
      expect(wrapper.textContent).toContain('Too short')

      const textarea = wrapper.querySelector('textarea') as HTMLTextAreaElement
      expect(textarea.name).toBe('content')
    })
  })

  describe('image paste', () => {
    const createPasteEvent = (items: Array<{ type: string; file: File | null }>) => {
      const pasteEvent = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: {
          items: Object.assign(
            items.map((item) => ({
              type: item.type,
              getAsFile: () => item.file,
            })),
            { length: items.length },
          ),
        },
      })
      return pasteEvent
    }

    it('should inline a pasted image as base64 Markdown', async () => {
      const originalFileReader = globalThis.FileReader
      try {
        const fakeBase64 = 'data:image/png;base64,dGVzdA=='
        globalThis.FileReader = class {
          result: string | null = fakeBase64
          onload: (() => void) | null = null
          onerror: (() => void) | null = null
          public readAsDataURL() {
            queueMicrotask(() => this.onload?.())
          }
        } as unknown as typeof FileReader

        await usingAsync(new Injector(), async (injector) => {
          const rootElement = document.getElementById('root') as HTMLDivElement
          const onValueChange = vi.fn()

          initializeShadeRoot({
            injector,
            rootElement,
            jsxElement: <MarkdownInput value="Hello " onValueChange={onValueChange} />,
          })

          await flushUpdates()

          const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
          textarea.selectionStart = 6
          textarea.selectionEnd = 6

          const file = new File(['png-data'], 'test.png', { type: 'image/png' })
          const pasteEvent = createPasteEvent([{ type: 'image/png', file }])
          textarea.dispatchEvent(pasteEvent)

          await flushUpdates()

          expect(onValueChange).toHaveBeenCalledOnce()
          const result = onValueChange.mock.calls[0][0] as string
          expect(result).toContain('![pasted image](data:')
          expect(result.startsWith('Hello ')).toBe(true)
        })
      } finally {
        globalThis.FileReader = originalFileReader
      }
    })

    it('should ignore pasted images exceeding maxImageSizeBytes', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownInput value="" onValueChange={onValueChange} maxImageSizeBytes={5} />,
        })

        await flushUpdates()

        const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
        const file = new File(['this-is-larger-than-5-bytes'], 'big.png', { type: 'image/png' })
        const pasteEvent = createPasteEvent([{ type: 'image/png', file }])
        textarea.dispatchEvent(pasteEvent)

        await flushUpdates()

        expect(onValueChange).not.toHaveBeenCalled()
      })
    })

    it('should not interfere with non-image paste', async () => {
      await usingAsync(new Injector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        const onValueChange = vi.fn()

        initializeShadeRoot({
          injector,
          rootElement,
          jsxElement: <MarkdownInput value="" onValueChange={onValueChange} />,
        })

        await flushUpdates()

        const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
        const file = new File(['text content'], 'note.txt', { type: 'text/plain' })
        const pasteEvent = createPasteEvent([{ type: 'text/plain', file }])
        const wasDefaultPrevented = !textarea.dispatchEvent(pasteEvent)

        await flushUpdates()

        expect(wasDefaultPrevented).toBe(false)
        expect(onValueChange).not.toHaveBeenCalled()
      })
    })
  })
})
