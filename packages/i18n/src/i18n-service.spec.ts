import { describe, expect, it } from 'vitest'
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
    const service = new I18NService(en)
    expect(service).toBeInstanceOf(I18NService)
  })

  it('Should return the available language codes', () => {
    const service = new I18NService(en, de)
    expect(service.getAvailableLanguageCodes()).toEqual(['en', 'de'])
  })

  it('Should register a language', () => {
    const service = new I18NService(en)
    expect(service.getAvailableLanguageCodes()).toEqual(['en'])
    service.registerLanguage(de)
    expect(service.getAvailableLanguageCodes()).toEqual(['en', 'de'])
  })

  describe('translate', () => {
    it('Should return the default language value', () => {
      const service = new I18NService(en)
      expect(service.translate('hello', 'en')).toBe('Hello')
    })

    it('Should return the default language value if the language is not found', () => {
      const service = new I18NService(en)
      expect(service.translate('hello', 'de')).toBe('Hello')
    })

    it('Should return the default value if the language is found but the key is not', () => {
      const service = new I18NService(en, de)
      expect(service.translate('bye', 'de')).toBe('Bye')
    })

    it('Should return the language value', () => {
      const service = new I18NService(en, de)
      expect(service.translate('hello', 'de')).toBe('Hallo')
    })
  })
})
