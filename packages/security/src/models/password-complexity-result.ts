export interface PasswordComplexitySuccessResult {
  success: true
}

export interface PasswordComplexityFailedResult {
  success: false
  message: string
  rule: string
}

export type PasswordComplexityResult = PasswordComplexitySuccessResult | PasswordComplexityFailedResult
