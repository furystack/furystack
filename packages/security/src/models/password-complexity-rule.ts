import type { PasswordComplexityResult } from './password-complexity-result'

export interface PasswordComplexityRule {
  name: string
  check: (passwordString: string) => Promise<PasswordComplexityResult>
}
