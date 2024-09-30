import { Injector } from '@furystack/inject'
import { describe, expect, it } from 'vitest'
import { usingAsync } from '../../utils/src/using-async.js'
import { createLanguage } from './create-language.js'
import { I18NService } from './i18n-service.js'
import { useI18N } from './use-i18n.js'

describe('useI18n', () => {
  it('Should register the service', async () => {
    await usingAsync(new Injector(), async (injector) => {
      const en = createLanguage({ code: 'en', values: { hello: 'Hello', bye: 'Bye' } })
      const de = createLanguage({ code: 'de', values: { hello: 'Hallo' } })

      const service = useI18N(injector, en, de)

      expect(injector.getInstance(I18NService)).toBe(service)
    })
  })
})
