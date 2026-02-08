import { ObservableValue } from '@furystack/utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createReactiveAttribute, createReactiveStyle, createReactiveTextNode } from './reactive-binding.js'
import { clearRenderContext, setRenderContext } from './render-context.js'
import { ResourceManager } from './services/resource-manager.js'

describe('reactive bindings', () => {
  afterEach(() => {
    clearRenderContext()
  })

  describe('createReactiveTextNode', () => {
    it('should create a text node with the initial observable value', () => {
      const obs = new ObservableValue(42) as ObservableValue<unknown>
      const node = createReactiveTextNode(obs)
      expect(node).toBeInstanceOf(Text)
      expect(node.textContent).toBe('42')
    })

    it('should update text content when observable changes', () => {
      const obs = new ObservableValue('hello') as ObservableValue<unknown>
      const node = createReactiveTextNode(obs)
      expect(node.textContent).toBe('hello')

      obs.setValue('world')
      expect(node.textContent).toBe('world')
    })

    it('should handle null/undefined values', () => {
      const obs = new ObservableValue<string | null>('initial') as ObservableValue<unknown>
      const node = createReactiveTextNode(obs)
      expect(node.textContent).toBe('initial')

      obs.setValue(null)
      expect(node.textContent).toBe('')
    })

    it('should register subscription with render context for cleanup', async () => {
      const rm = new ResourceManager()
      setRenderContext(rm)

      const obs = new ObservableValue('test') as ObservableValue<unknown>
      createReactiveTextNode(obs)

      expect(obs.getObservers().length).toBe(1)

      await rm[Symbol.asyncDispose]()
      expect(obs.getObservers().length).toBe(0)
    })

    it('should work without render context (subscription not managed)', () => {
      const obs = new ObservableValue('test') as ObservableValue<unknown>
      const node = createReactiveTextNode(obs)
      expect(node.textContent).toBe('test')

      obs.setValue('updated')
      expect(node.textContent).toBe('updated')
      expect(obs.getObservers().length).toBe(1)
    })
  })

  describe('createReactiveAttribute', () => {
    it('should set initial attribute value', () => {
      const el = document.createElement('div')
      const obs = new ObservableValue('active') as ObservableValue<unknown>
      createReactiveAttribute(el, 'class', obs)
      expect(el.getAttribute('class')).toBe('active')
    })

    it('should update attribute on observable change', () => {
      const el = document.createElement('div')
      const obs = new ObservableValue('old') as ObservableValue<unknown>
      createReactiveAttribute(el, 'data-state', obs)
      expect(el.getAttribute('data-state')).toBe('old')

      obs.setValue('new')
      expect(el.getAttribute('data-state')).toBe('new')
    })

    it('should remove attribute when value is null', () => {
      const el = document.createElement('div')
      const obs = new ObservableValue<string | null>('value') as ObservableValue<unknown>
      createReactiveAttribute(el, 'data-test', obs)
      expect(el.hasAttribute('data-test')).toBe(true)

      obs.setValue(null)
      expect(el.hasAttribute('data-test')).toBe(false)
    })

    it('should register subscription with render context', async () => {
      const rm = new ResourceManager()
      setRenderContext(rm)

      const el = document.createElement('div')
      const obs = new ObservableValue('test') as ObservableValue<unknown>
      createReactiveAttribute(el, 'data-test', obs)

      expect(obs.getObservers().length).toBe(1)

      await rm[Symbol.asyncDispose]()
      expect(obs.getObservers().length).toBe(0)
    })
  })

  describe('createReactiveStyle', () => {
    it('should set initial style property', () => {
      const el = document.createElement('div')
      const obs = new ObservableValue('red') as ObservableValue<unknown>
      createReactiveStyle(el, 'color', obs)
      expect(el.style.color).toBe('red')
    })

    it('should update style on observable change', () => {
      const el = document.createElement('div')
      const obs = new ObservableValue('10px') as ObservableValue<unknown>
      createReactiveStyle(el, 'fontSize', obs)
      expect(el.style.fontSize).toBe('10px')

      obs.setValue('20px')
      expect(el.style.fontSize).toBe('20px')
    })

    it('should clear style when value is null', () => {
      const el = document.createElement('div')
      const obs = new ObservableValue<string | null>('red') as ObservableValue<unknown>
      createReactiveStyle(el, 'color', obs)
      expect(el.style.color).toBe('red')

      obs.setValue(null)
      expect(el.style.color).toBe('')
    })

    it('should register subscription with render context', async () => {
      const rm = new ResourceManager()
      setRenderContext(rm)

      const el = document.createElement('div')
      const obs = new ObservableValue('blue') as ObservableValue<unknown>
      createReactiveStyle(el, 'color', obs)

      expect(obs.getObservers().length).toBe(1)

      await rm[Symbol.asyncDispose]()
      expect(obs.getObservers().length).toBe(0)
    })
  })
})
