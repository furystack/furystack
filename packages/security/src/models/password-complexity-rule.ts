import type { PasswordComplexityResult } from './password-complexity-result.js'

export interface PasswordComplexityRule {
  name: string
  check: (passwordString: string) => Promise<PasswordComplexityResult>
}
