import type { PasswordComplexityRule } from '../models/password-complexity-rule.js'

/**
 * @param maxLength The maximum password length
 * @returns The created Password Policy object
 */
export const createMaxLengthComplexityRule = (maxLength: number): PasswordComplexityRule => ({
  name: 'maxLength' as const,
  check: async (passwordString: string) => {
    const success = passwordString.length <= maxLength
    if (success) {
      return { success }
    }
    return { success, message: `The password has to be maximum ${maxLength} character length`, rule: 'maxLength' }
  },
})
