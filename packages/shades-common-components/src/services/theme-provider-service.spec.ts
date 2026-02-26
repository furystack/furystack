import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProviderService } from './theme-provider-service.js'

describe('ThemeProviderService', () => {
  let service: ThemeProviderService

  beforeEach(() => {
    service = new ThemeProviderService()
  })

  describe('getRgbFromColorString (delegation)', () => {
    it('should delegate to standalone getRgbFromColorString', () => {
      const result = service.getRgbFromColorString('#ff0000')
      expect(result.r).toBe(255)
      expect(result.g).toBe(0)
      expect(result.b).toBe(0)
    })
  })

  describe('getTextColor (delegation)', () => {
    it('should delegate to standalone getTextColor', () => {
      expect(service.getTextColor('#ffffff')).toBe('#000000')
      expect(service.getTextColor('#000000')).toBe('#FFFFFF')
    })
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
})
