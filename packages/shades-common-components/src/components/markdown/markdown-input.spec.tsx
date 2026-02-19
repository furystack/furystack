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
})
