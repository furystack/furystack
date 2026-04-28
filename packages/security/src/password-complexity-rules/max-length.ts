import type { PasswordComplexityRule } from '../models/password-complexity-rule.js'

/** Builds a complexity rule that fails when the password is longer than `maxLength`. */
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
