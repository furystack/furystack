import { createInjector } from '@furystack/inject'
import { createComponent, flushUpdates, initializeShadeRoot } from '@furystack/shades'
import { usingAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TextArea } from './text-area.js'

describe('TextArea', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render as custom element', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area')
      expect(textArea).not.toBeNull()
    })
  })

  it('should render label with labelTitle', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea labelTitle="Test Label" />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area')
      expect(textArea).not.toBeNull()

      const label = textArea?.querySelector('label')
      expect(label).not.toBeNull()

      const span = textArea?.querySelector('span')
      expect(span?.textContent).toBe('Test Label')
    })
  })

  it('should apply labelProps to label element', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea labelTitle="Test" labelProps={{ className: 'custom-label-class' }} />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area')
      const label = textArea?.querySelector('label')

      expect(label?.className).toBe('custom-label-class')
    })
  })

  it('should set data-variant attribute for outlined variant', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea variant="outlined" />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area') as HTMLElement
      expect(textArea).not.toBeNull()
      expect(textArea.getAttribute('data-variant')).toBe('outlined')
    })
  })

  it('should set data-variant attribute for contained variant', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea variant="contained" />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area') as HTMLElement
      expect(textArea).not.toBeNull()
      expect(textArea.getAttribute('data-variant')).toBe('contained')
    })
  })

  it('should not set data-variant attribute when no variant is provided', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area') as HTMLElement
      expect(textArea).not.toBeNull()
      expect(textArea.hasAttribute('data-variant')).toBe(false)
    })
  })

  it('should set data-disabled attribute when disabled', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea disabled />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area') as HTMLElement
      expect(textArea).not.toBeNull()
      expect(textArea.hasAttribute('data-disabled')).toBe(true)
    })
  })

  it('should not set data-disabled attribute when not disabled', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea disabled={false} />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area') as HTMLElement
      expect(textArea).not.toBeNull()
      expect(textArea.hasAttribute('data-disabled')).toBe(false)
    })
  })

  it('should render value in contentEditable div', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea value="Test content" />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area')
      const contentDiv = textArea?.querySelector('.textarea-content')

      expect(contentDiv).not.toBeNull()
      expect(contentDiv?.textContent).toBe('Test content')
    })
  })

  it('should have contentEditable true when not readOnly or disabled', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area')
      const contentDiv = textArea?.querySelector('.textarea-content') as HTMLElement

      expect(contentDiv?.contentEditable).toBe('true')
    })
  })

  it('should have contentEditable inherit when readOnly is true', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea readOnly />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area')
      const contentDiv = textArea?.querySelector('.textarea-content') as HTMLElement

      expect(contentDiv?.contentEditable).toBe('inherit')
    })
  })

  it('should have contentEditable inherit when disabled is true', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea disabled />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area')
      const contentDiv = textArea?.querySelector('.textarea-content') as HTMLElement

      expect(contentDiv?.contentEditable).toBe('inherit')
    })
  })

  it('should apply custom style to content div', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea style={{ color: 'red' }} />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area')
      const contentDiv = textArea?.querySelector('.textarea-content') as HTMLElement

      expect(contentDiv?.style.color).toBe('red')
    })
  })

  it('should apply custom style to label element', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea labelProps={{ style: { backgroundColor: 'blue' } }} />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area')
      const label = textArea?.querySelector('label') as HTMLElement

      expect(label?.style.backgroundColor).toBe('blue')
    })
  })

  it('should have correct CSS styles applied', async () => {
    await usingAsync(createInjector(), async (injector) => {
      const rootElement = document.getElementById('root') as HTMLDivElement

      initializeShadeRoot({
        injector,
        rootElement,
        jsxElement: <TextArea />,
      })

      await flushUpdates()

      const textArea = document.querySelector('shade-text-area') as HTMLElement
      expect(textArea).not.toBeNull()

      const computedStyle = window.getComputedStyle(textArea)
      expect(computedStyle.display).toBe('block')
      expect(computedStyle.marginBottom).toBe('1em')
    })
  })

  describe('size', () => {
    it('should not set data-size when size is not specified', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        initializeShadeRoot({ injector, rootElement, jsxElement: <TextArea /> })
        await flushUpdates()
        const el = document.querySelector('shade-text-area') as HTMLElement
        expect(el.getAttribute('data-size')).toBeNull()
      })
    })

    it('should not set data-size for medium size (default)', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        initializeShadeRoot({ injector, rootElement, jsxElement: <TextArea size="medium" /> })
        await flushUpdates()
        const el = document.querySelector('shade-text-area') as HTMLElement
        expect(el.getAttribute('data-size')).toBeNull()
      })
    })

    it('should set data-size="small" for small size', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        initializeShadeRoot({ injector, rootElement, jsxElement: <TextArea size="small" /> })
        await flushUpdates()
        const el = document.querySelector('shade-text-area') as HTMLElement
        expect(el.getAttribute('data-size')).toBe('small')
      })
    })

    it('should set data-size="large" for large size', async () => {
      await usingAsync(createInjector(), async (injector) => {
        const rootElement = document.getElementById('root') as HTMLDivElement
        initializeShadeRoot({ injector, rootElement, jsxElement: <TextArea size="large" /> })
        await flushUpdates()
        const el = document.querySelector('shade-text-area') as HTMLElement
        expect(el.getAttribute('data-size')).toBe('large')
      })
    })
  })
})
