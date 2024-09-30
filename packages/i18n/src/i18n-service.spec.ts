import { describe, expect, it, vi } from 'vitest'
import { using } from '../../utils/src/using.js'
import { createLanguage } from './create-language.js'
import { I18NService } from './i18n-service.js'

const en = createLanguage({
  code: 'en',
  values: {
    hello: 'Hello',
    bye: 'Bye',
  },
})

const de = createLanguage({
  code: 'de',
  values: {
    hello: 'Hallo',
  },
})

describe('I18nService', () => {
  it('Should be constructed', () => {
    using(new I18NService(en), (service) => {
      expect(service).toBeInstanceOf(I18NService)
    })
  })

  it('Should return the available language codes', () => {
    using(new I18NService(en, de), (service) => {
      expect(service.getAvailableLanguageCodes()).toEqual(['en', 'de'])
    })
  })

  it('Should register a language', () => {
    using(new I18NService(en), (service) => {
      expect(service.getAvailableLanguageCodes()).toEqual(['en'])
      service.registerLanguage(de)
      expect(service.getAvailableLanguageCodes()).toEqual(['en', 'de'])
    })
  })

  describe('translate', () => {
    it('Should return the default language value', () => {
      using(new I18NService(en), (service) => {
        expect(service.translate('hello', 'en')).toBe('Hello')
      })
    })

    it('Should return the default language value if the language is not found', () => {
      using(new I18NService(en), (service) => {
        expect(service.translate('hello', 'de')).toBe('Hello')
      })
    })

    it('Should return the default value if the language is found but the key is not', () => {
      using(new I18NService(en, de), (service) => {
        expect(service.translate('bye', 'de')).toBe('Bye')
      })
    })

    it('Should return the language value', () => {
      using(new I18NService(en, de), (service) => {
        expect(service.translate('hello', 'de')).toBe('Hallo')
      })
    })
  })

  describe('currentLanguage', () => {
    it('Should set to the default language', () => {
      using(new I18NService(en), (service) => {
        expect(service.currentLanguage).toBe('en')
      })
    })

    it('Should not emit change if the new language is the same as the current', () => {
      using(new I18NService(en), (service) => {
        const subscription = vi.fn()
        service.addListener('languageChange', subscription)

        service.currentLanguage = 'en'

        expect(subscription).not.toHaveBeenCalled()
      })
    })

    it('Should throw error and keep language if the language is not available', () => {
      using(new I18NService(en), (service) => {
        const subscription = vi.fn()
        service.addListener('languageChange', subscription)

        expect(() => {
          service.currentLanguage = 'de'
        }).toThrowError("Language 'de' is not available")

        expect(service.currentLanguage).toBe('en')

        expect(subscription).not.toHaveBeenCalled()
      })
    })

    it('Should update the language and emit languageChange event', () => {
      using(new I18NService(en, de), (service) => {
        const subscription = vi.fn()
        service.addListener('languageChange', subscription)

        service.currentLanguage = 'de'

        expect(service.currentLanguage).toBe('de')
        expect(subscription).toHaveBeenCalledWith('de')
      })
    })
  })
})
