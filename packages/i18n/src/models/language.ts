import type { TranslationValues } from './translation-values.js'

export type Language<TKeys extends string> = {
  code: string
  values: TranslationValues<TKeys>
}
