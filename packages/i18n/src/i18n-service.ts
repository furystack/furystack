import { Injectable } from '@furystack/inject'
import type { Language } from './models/language.js'
import type { PartialLanguage } from './models/partial-language.js'

@Injectable({
  lifetime: 'explicit',
})
export class I18NService<Keys extends string> {
  private readonly additionalLanguages: Array<PartialLanguage<Keys>>

  constructor(
    private readonly defaultLanguage: Language<Keys>,
    ...additionalLanguages: Array<PartialLanguage<Keys>>
  ) {
    this.additionalLanguages = additionalLanguages
  }

  /**
   * @returns The available language codes
   */
  public getAvailableLanguageCodes(): string[] {
    return [this.defaultLanguage.code, ...this.additionalLanguages.map((language) => language.code)]
  }

  /**
   * Adds a new language to the service on-the-fly.
   * @param language The language to register
   */
  public registerLanguage(language: PartialLanguage<Keys>): void {
    this.additionalLanguages.push(language)
  }

  /**
   *
   * @param key The translation key
   * @param languageCode An optional language code, will fall back to the default language code if not provided
   * @returns The translation for the given key in the given language. If the language is not found or does not contain the key, the translation from the default language will be returned.
   */
  public translate<K extends Keys>(key: K, languageCode = this.defaultLanguage.code): string {
    if (languageCode === this.defaultLanguage.code) {
      return this.defaultLanguage.values[key]
    }
    return (
      this.additionalLanguages.find((language) => language.code === languageCode)?.values[key] ??
      this.defaultLanguage.values[key]
    )
  }
}
