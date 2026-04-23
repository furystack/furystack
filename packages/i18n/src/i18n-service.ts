import type { Token } from '@furystack/inject'
import { defineService } from '@furystack/inject'
import { EventHub } from '@furystack/utils'
import type { Language } from './models/language.js'
import type { PartialLanguage } from './models/partial-language.js'

/**
 * Events emitted by an {@link I18NService}.
 */
export type I18NServiceEvents = {
  /** Fired when {@link I18NService.currentLanguage} changes to a different code. */
  languageChange: string
}

/**
 * Translation service contract.
 *
 * The library never mints a shared `I18NService` token — key-sets vary per
 * application, so each app declares its own typed token via {@link defineI18N}.
 */
export interface I18NService<TKeys extends string> extends EventHub<I18NServiceEvents> {
  /** Currently active language code. Setter throws if the code is not registered. */
  currentLanguage: string
  /** Returns the registered language codes (default language first). */
  getAvailableLanguageCodes(): string[]
  /** Adds a new language at runtime. */
  registerLanguage(language: PartialLanguage<TKeys>): void
  /**
   * Translates `key`. Falls back to the default language when the requested
   * language code is missing or does not contain the key.
   */
  translate<K extends TKeys>(key: K, languageCode?: string): string
}

/**
 * Concrete {@link I18NService} implementation. Exported so tests (and simple
 * non-DI consumers) can instantiate it directly. Prefer {@link defineI18N} in
 * application code so the service is managed by the injector.
 */
export class I18NServiceImpl<TKeys extends string> extends EventHub<I18NServiceEvents> implements I18NService<TKeys> {
  private readonly additionalLanguages: Array<PartialLanguage<TKeys>>

  private _currentLanguage: string
  public get currentLanguage(): string {
    return this._currentLanguage
  }
  public set currentLanguage(v: string) {
    if (v === this._currentLanguage) {
      return
    }

    if (!this.getAvailableLanguageCodes().includes(v)) {
      throw new Error(`Language '${v}' is not available`)
    }

    this._currentLanguage = v
    this.emit('languageChange', v)
  }

  constructor(
    private readonly defaultLanguage: Language<TKeys>,
    ...additionalLanguages: Array<PartialLanguage<TKeys>>
  ) {
    super()
    this.additionalLanguages = additionalLanguages
    this._currentLanguage = defaultLanguage.code
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
  public registerLanguage(language: PartialLanguage<TKeys>): void {
    this.additionalLanguages.push(language)
  }

  /**
   * Translates a key to the corresponding value in the specified language
   * @param key The translation key
   * @param languageCode An optional language code, will fall back to the current language code if not provided
   * @returns The translation for the given key in the given language. If the language is not found or does not contain the key, the translation from the default language will be returned.
   */
  public translate<K extends TKeys>(key: K, languageCode = this.currentLanguage): string {
    if (languageCode === this.defaultLanguage.code) {
      return this.defaultLanguage.values[key]
    }
    return (
      this.additionalLanguages.find((language) => language.code === languageCode)?.values[key] ??
      this.defaultLanguage.values[key]
    )
  }
}

/**
 * Mints a singleton {@link Token} for an {@link I18NService} configured with
 * the provided default + additional languages. Declare the token once at
 * module scope — calling {@link defineI18N} inline every time produces a new
 * token identity per call and defeats singleton caching.
 *
 * @example
 * ```ts
 * // app/i18n.ts
 * export const AppI18n = defineI18N(en, de, fr)
 *
 * // elsewhere
 * const i18n = injector.get(AppI18n)
 * i18n.translate('hello')
 * ```
 */
export const defineI18N = <TKeys extends string>(
  defaultLanguage: Language<TKeys>,
  ...additionalLanguages: Array<PartialLanguage<TKeys>>
): Token<I18NService<TKeys>, 'singleton'> =>
  defineService({
    name: `@furystack/i18n/I18NService(${defaultLanguage.code})`,
    lifetime: 'singleton',
    factory: ({ onDispose }) => {
      const service = new I18NServiceImpl<TKeys>(defaultLanguage, ...additionalLanguages)
      // eslint-disable-next-line furystack/prefer-using-wrapper -- paired with onDispose registration
      onDispose(() => service[Symbol.dispose]())
      return service
    },
  })
