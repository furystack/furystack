import type { Injector } from '@furystack/inject'
import { I18NService } from './i18n-service.js'
import type { Language } from './models/language.js'
import type { PartialLanguage } from './models/partial-language.js'

export const useI18N = <TKeys extends string>(
  injector: Injector,
  defaultLanguage: Language<TKeys>,
  ...additionalLanguages: Array<PartialLanguage<TKeys>>
) => {
  const service = new I18NService(defaultLanguage, ...additionalLanguages)
  injector.setExplicitInstance(service)
  return service
}
