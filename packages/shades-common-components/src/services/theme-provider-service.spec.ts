import type { Injector } from '@furystack/inject'
import { createInjector } from '@furystack/inject'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ThemeProviderService } from './theme-provider-service.js'

describe('ThemeProviderService', () => {
  let injector: Injector
  let service: ThemeProviderService

  beforeEach(() => {
    injector = createInjector()
    service = injector.get(ThemeProviderService)
  })

  afterEach(async () => {
    await injector[Symbol.asyncDispose]()
  })

  describe('theme management', () => {
    it('should have initial theme assigned', () => {
      expect(service.getAssignedTheme()).toBeDefined()
      expect(service.getAssignedTheme().name).toBe('css-variable-theme')
    })

    it('should expose cssVariableTheme as theme property', () => {
      expect(service.theme).toBeDefined()
      expect(service.theme.name).toBe('css-variable-theme')
    })
  })

  describe('setAssignedTheme with custom root', () => {
    let customRoot: HTMLElement

    beforeEach(() => {
      customRoot = document.createElement('div')
      document.body.appendChild(customRoot)
    })

    afterEach(() => {
      customRoot.remove()
      document.documentElement.style.cssText = ''
    })

    it('should apply CSS variables to the provided root element', () => {
      service.setAssignedTheme(
        {
          text: { primary: '#abcdef' },
          palette: { primary: { main: '#123456' } },
        },
        customRoot,
      )

      expect(customRoot.style.getPropertyValue('--shades-theme-text-primary')).toBe('#abcdef')
      expect(customRoot.style.getPropertyValue('--shades-theme-palette-primary-main')).toBe('#123456')
      expect(document.documentElement.style.getPropertyValue('--shades-theme-text-primary')).toBe('')
    })

    it('should still update the stored theme when a custom root is provided', () => {
      const theme = { text: { primary: '#111' } }
      service.setAssignedTheme(theme, customRoot)

      expect(service.getAssignedTheme()).toBe(theme)
    })

    it('should emit themeChanged when a custom root is provided', () => {
      const theme = { text: { primary: '#222' } }
      let emittedTheme: unknown

      service.subscribe('themeChanged', (t) => {
        emittedTheme = t
      })

      service.setAssignedTheme(theme, customRoot)

      expect(emittedTheme).toBe(theme)
    })
  })
})
