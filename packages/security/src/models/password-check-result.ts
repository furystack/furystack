export interface PasswordCheckSuccessResult {
  isValid: true
  willExpire?: string
}

export interface PasswordCheckFailedResult {
  isValid: false
  reason: 'badUsernameOrPassword' | 'passwordExpired'
}

export type PasswordCheckResult = PasswordCheckFailedResult | PasswordCheckSuccessResult
