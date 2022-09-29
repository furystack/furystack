import type { PasswordComplexityRule } from '../models'

/**
 * @param upperCaseCount The minimum upper case characters length
 * @returns The created Password Policy object
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
