import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProviderService } from './theme-provider-service.js'

describe('ThemeProviderService', () => {
  let service: ThemeProviderService

  beforeEach(() => {
    service = new ThemeProviderService()
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
