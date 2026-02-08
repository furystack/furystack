import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Shade } from './shade.js'
import { StyleManager } from './style-manager.js'

describe('StyleManager', () => {
  beforeEach(() => {
    StyleManager.clear()
  })

  afterEach(() => {
    StyleManager.clear()
  })

  describe('registerComponentStyles', () => {
    it('should register styles for a component', () => {
      const result = StyleManager.registerComponentStyles('test-component', {
        color: 'red',
        padding: '10px',
      })

      expect(result).toBe(true)
      expect(StyleManager.isRegistered('test-component')).toBe(true)
    })

    it('should inject CSS into a style element', () => {
      StyleManager.registerComponentStyles('test-component', {
        color: 'red',
      })

      const styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement).not.toBeNull()
      expect(styleElement?.textContent).toContain('test-component')
      expect(styleElement?.textContent).toContain('color: red')
    })

    it('should not register the same component twice', () => {
      const result1 = StyleManager.registerComponentStyles('test-component', {
        color: 'red',
      })
      const result2 = StyleManager.registerComponentStyles('test-component', {
        color: 'blue',
      })

      expect(result1).toBe(true)
      expect(result2).toBe(false)

      // Should only have the first style
      const styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement?.textContent).toContain('color: red')
      expect(styleElement?.textContent).not.toContain('color: blue')
    })

    it('should handle pseudo-selectors', () => {
      StyleManager.registerComponentStyles('test-button', {
        backgroundColor: 'blue',
        '&:hover': { backgroundColor: 'darkblue' },
      })

      const styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement?.textContent).toContain('test-button:hover')
      expect(styleElement?.textContent).toContain('background-color: darkblue')
    })

    it('should return false for empty CSS object', () => {
      const result = StyleManager.registerComponentStyles('empty-component', {})

      expect(result).toBe(false)
      expect(StyleManager.isRegistered('empty-component')).toBe(false)
    })

    it('should add comments with component name', () => {
      StyleManager.registerComponentStyles('my-component', {
        color: 'red',
      })

      const styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement?.textContent).toContain('/* my-component */')
    })

    it('should generate attribute selector for customized built-in elements', () => {
      StyleManager.registerComponentStyles(
        'my-link',
        {
          color: 'blue',
          textDecoration: 'none',
        },
        'a',
      )

      const styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement?.textContent).toContain('a[is="my-link"]')
      expect(styleElement?.textContent).toContain('color: blue')
      expect(styleElement?.textContent).toContain('text-decoration: none')
    })

    it('should handle pseudo-selectors for customized built-in elements', () => {
      StyleManager.registerComponentStyles(
        'my-button',
        {
          backgroundColor: 'gray',
          '&:hover': { backgroundColor: 'darkgray' },
          '&:active': { transform: 'scale(0.98)' },
        },
        'button',
      )

      const styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement?.textContent).toContain('button[is="my-button"]')
      expect(styleElement?.textContent).toContain('button[is="my-button"]:hover')
      expect(styleElement?.textContent).toContain('button[is="my-button"]:active')
    })
  })

  describe('isRegistered', () => {
    it('should return true for registered components', () => {
      StyleManager.registerComponentStyles('test-component', { color: 'red' })

      expect(StyleManager.isRegistered('test-component')).toBe(true)
    })

    it('should return false for unregistered components', () => {
      expect(StyleManager.isRegistered('unknown-component')).toBe(false)
    })
  })

  describe('getRegisteredComponents', () => {
    it('should return all registered component names', () => {
      StyleManager.registerComponentStyles('component-a', { color: 'red' })
      StyleManager.registerComponentStyles('component-b', { color: 'blue' })

      const registered = StyleManager.getRegisteredComponents()

      expect(registered.has('component-a')).toBe(true)
      expect(registered.has('component-b')).toBe(true)
      expect(registered.size).toBe(2)
    })

    it('should return empty set when no components registered', () => {
      const registered = StyleManager.getRegisteredComponents()
      expect(registered.size).toBe(0)
    })
  })

  describe('clear', () => {
    it('should clear all registered components', () => {
      StyleManager.registerComponentStyles('test-component', { color: 'red' })
      expect(StyleManager.isRegistered('test-component')).toBe(true)

      StyleManager.clear()

      expect(StyleManager.isRegistered('test-component')).toBe(false)
      expect(StyleManager.getRegisteredComponents().size).toBe(0)
    })

    it('should remove style element on clear', () => {
      StyleManager.registerComponentStyles('test-component', { color: 'red' })
      let styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement).not.toBeNull()

      StyleManager.clear()

      styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement).toBeNull()
    })
  })

  describe('reusing style element', () => {
    it('should use the same style element for multiple components', () => {
      StyleManager.registerComponentStyles('component-a', { color: 'red' })
      StyleManager.registerComponentStyles('component-b', { color: 'blue' })

      const styleElements = document.querySelectorAll('[data-shades-styles]')
      expect(styleElements.length).toBe(1)

      const styleElement = styleElements[0]
      expect(styleElement?.textContent).toContain('component-a')
      expect(styleElement?.textContent).toContain('component-b')
    })
  })

  describe('Shade integration', () => {
    it('should register CSS styles when Shade component is created with css property', () => {
      Shade({
        tagName: 'shade-css-test-component',
        css: {
          color: 'red',
          padding: '10px',
          '&:hover': { color: 'blue' },
        },
        render: () => null,
      })

      expect(StyleManager.isRegistered('shade-css-test-component')).toBe(true)

      const styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement?.textContent).toContain('shade-css-test-component')
      expect(styleElement?.textContent).toContain('color: red')
      expect(styleElement?.textContent).toContain('shade-css-test-component:hover')
    })

    it('should register CSS with attribute selector for customized built-in elements', () => {
      Shade({
        tagName: 'shade-css-test-button',
        elementBase: HTMLButtonElement,
        elementBaseName: 'button',
        css: {
          backgroundColor: 'blue',
          '&:hover': { backgroundColor: 'darkblue' },
        },
        render: () => null,
      })

      expect(StyleManager.isRegistered('shade-css-test-button')).toBe(true)

      const styleElement = document.querySelector('[data-shades-styles]')
      expect(styleElement?.textContent).toContain('button[is="shade-css-test-button"]')
      expect(styleElement?.textContent).toContain('button[is="shade-css-test-button"]:hover')
    })

    it('should not register styles when Shade component has no css property', () => {
      Shade({
        tagName: 'shade-no-css-component',
        render: () => null,
      })

      expect(StyleManager.isRegistered('shade-no-css-component')).toBe(false)
    })
  })
})
