import { Injector } from '@furystack/inject'
import { createComponent, initializeShadeRoot } from '@furystack/shades'
import { sleepAsync } from '@furystack/utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TextArea } from './text-area.js'

describe('TextArea', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should render with shadow DOM', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area')
    expect(textArea).not.toBeNull()
  })

  it('should render label with labelTitle', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea labelTitle="Test Label" />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area')
    expect(textArea).not.toBeNull()

    const label = textArea?.querySelector('label')
    expect(label).not.toBeNull()

    const span = textArea?.querySelector('span')
    expect(span?.textContent).toBe('Test Label')
  })

  it('should apply labelProps to label element', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea labelTitle="Test" labelProps={{ className: 'custom-label-class' }} />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area')
    const label = textArea?.querySelector('label')

    expect(label?.className).toBe('custom-label-class')
  })

  it('should set data-variant attribute for outlined variant', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea variant="outlined" />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area') as HTMLElement
    expect(textArea).not.toBeNull()
    expect(textArea.getAttribute('data-variant')).toBe('outlined')
  })

  it('should set data-variant attribute for contained variant', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea variant="contained" />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area') as HTMLElement
    expect(textArea).not.toBeNull()
    expect(textArea.getAttribute('data-variant')).toBe('contained')
  })

  it('should not set data-variant attribute when no variant is provided', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area') as HTMLElement
    expect(textArea).not.toBeNull()
    expect(textArea.hasAttribute('data-variant')).toBe(false)
  })

  it('should set data-disabled attribute when disabled', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea disabled />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area') as HTMLElement
    expect(textArea).not.toBeNull()
    expect(textArea.hasAttribute('data-disabled')).toBe(true)
  })

  it('should not set data-disabled attribute when not disabled', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea disabled={false} />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area') as HTMLElement
    expect(textArea).not.toBeNull()
    expect(textArea.hasAttribute('data-disabled')).toBe(false)
  })

  it('should render value in contentEditable div', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea value="Test content" />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area')
    const contentDiv = textArea?.querySelector('.textarea-content')

    expect(contentDiv).not.toBeNull()
    expect(contentDiv?.textContent).toBe('Test content')
  })

  it('should have contentEditable true when not readOnly or disabled', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area')
    const contentDiv = textArea?.querySelector('.textarea-content') as HTMLElement

    expect(contentDiv?.contentEditable).toBe('true')
  })

  it('should have contentEditable inherit when readOnly is true', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea readOnly />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area')
    const contentDiv = textArea?.querySelector('.textarea-content') as HTMLElement

    expect(contentDiv?.contentEditable).toBe('inherit')
  })

  it('should have contentEditable inherit when disabled is true', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea disabled />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area')
    const contentDiv = textArea?.querySelector('.textarea-content') as HTMLElement

    expect(contentDiv?.contentEditable).toBe('inherit')
  })

  it('should apply custom style to content div', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea style={{ color: 'red' }} />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area')
    const contentDiv = textArea?.querySelector('.textarea-content') as HTMLElement

    expect(contentDiv?.style.color).toBe('red')
  })

  it('should apply custom style to label element', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea labelProps={{ style: { backgroundColor: 'blue' } }} />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area')
    const label = textArea?.querySelector('label') as HTMLElement

    expect(label?.style.backgroundColor).toBe('blue')
  })

  it('should have correct CSS styles applied', async () => {
    const injector = new Injector()
    const rootElement = document.getElementById('root') as HTMLDivElement

    initializeShadeRoot({
      injector,
      rootElement,
      jsxElement: <TextArea />,
    })

    await sleepAsync(50)

    const textArea = document.querySelector('shade-text-area') as HTMLElement
    expect(textArea).not.toBeNull()

    const computedStyle = window.getComputedStyle(textArea)
    expect(computedStyle.display).toBe('block')
    expect(computedStyle.marginBottom).toBe('1em')
  })
})
