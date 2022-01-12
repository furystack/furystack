import type { PasswordComplexityRule } from '../models/password-complexity-rule'

/**
 * @param minLength The minimum password length
 * @returns The created Password Policy object
 */
export const createMinLengthComplexityRule = (minLength: number): PasswordComplexityRule => ({
  name: 'minLength' as const,
  check: async (passwordString: string) => {
    const success = passwordString.length >= minLength
    if (success) {
      return { success }
    }
    return { success, message: `The password has to be at least ${minLength} character length`, rule: 'minLength' }
  },
})
