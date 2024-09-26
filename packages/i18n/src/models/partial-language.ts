import type { TranslationValues } from './translation-values.js'

export type PartialLanguage<TKeys extends string> = {
  code: string
  values: Partial<TranslationValues<TKeys>>
}
