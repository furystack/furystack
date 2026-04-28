import type { PasswordComplexityRule } from '../models/password-complexity-rule.js'

/**
 * Builds a complexity rule that requires at least `upperCaseCount` uppercase
 * characters. Diacritics are stripped before counting (`Á` counts as `A`).
 */
export const createContainsUppercasePolicy = (upperCaseCount: number): PasswordComplexityRule => ({
  name: 'containsUppercase' as const,
  check: async (passwordString: string) => {
    const actualUpperCaseCount = passwordString
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^A-Z]/g, '').length
    const success = actualUpperCaseCount >= upperCaseCount
    if (success) {
      return { success }
    }
    return {
      success,
      message: `The password should contain at least ${upperCaseCount} upper case characters`,
      rule: 'containsUppercase',
    }
  },
})
