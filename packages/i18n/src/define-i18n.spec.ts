import { createInjector } from '@furystack/inject'
import { describe, expect, it, vi } from 'vitest'
import { createLanguage } from './create-language.js'
import { defineI18N } from './i18n-service.js'

describe('defineI18N', () => {
  const en = createLanguage({ code: 'en', values: { hello: 'Hello', bye: 'Bye' } })
  const de = createLanguage({ code: 'de', values: { hello: 'Hallo' } })

  it('mints a token that resolves a configured I18NService', async () => {
    const AppI18n = defineI18N(en, de)
    const injector = createInjector()
    try {
      const service = injector.get(AppI18n)
      expect(service.getAvailableLanguageCodes()).toEqual(['en', 'de'])
      expect(service.translate('hello')).toBe('Hello')
      expect(service.translate('hello', 'de')).toBe('Hallo')
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('resolves as a singleton — repeated get returns the same instance', async () => {
    const AppI18n = defineI18N(en)
    const injector = createInjector()
    try {
      expect(injector.get(AppI18n)).toBe(injector.get(AppI18n))
    } finally {
      await injector[Symbol.asyncDispose]()
    }
  })

  it('disposes the service when the injector is disposed', async () => {
    const AppI18n = defineI18N(en, de)
    const injector = createInjector()
    const service = injector.get(AppI18n)
    const listener = vi.fn()
    service.addListener('languageChange', listener)

    await injector[Symbol.asyncDispose]()

    service.currentLanguage = 'de'
    expect(listener).not.toHaveBeenCalled()
  })
})
