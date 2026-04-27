import type { Language } from './models/language.js'

/**
 * Identity helper that locks `TKeys` from the literal-typed `values` map.
 * Use as `createLanguage({ code: 'en', values: { ... } as const })` so
 * downstream `translate(key)` calls get autocomplete + exhaustiveness.
 */
export const createLanguage = <TKeys extends string>(language: Language<TKeys>): Language<TKeys> => language
