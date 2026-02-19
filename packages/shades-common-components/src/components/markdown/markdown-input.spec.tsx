import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync, usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MarkdownInput } from './markdown-input.js'

describe('MarkdownInput', () => {
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
        jsxElement: <MarkdownInput value="" />,
      })

      await sleepAsync(50)

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

      await sleepAsync(50)

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

      await sleepAsync(50)

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

      await sleepAsync(50)

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

      await sleepAsync(50)

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

      await sleepAsync(50)

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

      await sleepAsync(50)

      const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
      textarea.value = '# New content'
      textarea.dispatchEvent(new Event('input', { bubbles: true }))

      await sleepAsync(50)

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

      await sleepAsync(50)

      const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
      expect(textarea.rows).toBe(20)
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

          await sleepAsync(50)

          const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
          textarea.selectionStart = 6
          textarea.selectionEnd = 6

          const file = new File(['png-data'], 'test.png', { type: 'image/png' })
          const pasteEvent = createPasteEvent([{ type: 'image/png', file }])
          textarea.dispatchEvent(pasteEvent)

          await sleepAsync(100)

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

        await sleepAsync(50)

        const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
        const file = new File(['this-is-larger-than-5-bytes'], 'big.png', { type: 'image/png' })
        const pasteEvent = createPasteEvent([{ type: 'image/png', file }])
        textarea.dispatchEvent(pasteEvent)

        await sleepAsync(100)

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

        await sleepAsync(50)

        const textarea = document.querySelector('shade-markdown-input textarea') as HTMLTextAreaElement
        const file = new File(['text content'], 'note.txt', { type: 'text/plain' })
        const pasteEvent = createPasteEvent([{ type: 'text/plain', file }])
        const wasDefaultPrevented = !textarea.dispatchEvent(pasteEvent)

        await sleepAsync(100)

        expect(wasDefaultPrevented).toBe(false)
        expect(onValueChange).not.toHaveBeenCalled()
      })
    })
  })
})
