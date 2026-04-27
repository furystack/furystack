import type { PasswordComplexityRule } from '../models/password-complexity-rule.js'

/**
 * Builds a complexity rule that requires at least `lowerCaseCount` lowercase
 * characters. Diacritics are stripped before counting.
 */
export const createContainsLowercasePolicy = (lowerCaseCount: number): PasswordComplexityRule => ({
  name: 'containsLowercase' as const,
  check: async (passwordString: string) => {
    const actualLowerCaseCount =
      passwordString.length >= lowerCaseCount
        ? passwordString
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z]/g, '').length
        : 0
    const success = actualLowerCaseCount >= lowerCaseCount
    if (success) {
      return { success }
    }
    return {
      success,
      message: `The password should contain at least ${lowerCaseCount} lower case characters`,
      rule: 'containsLowercase',
    }
  },
})
