import type { Language } from './models/language.js'

export const createLanguage = <TKeys extends string>(language: Language<TKeys>): Language<TKeys> => language
