export interface PasswordCheckSuccessResult {
  isValid: true
  willExpire?: string
}

export interface PasswordCheckFailedResult {
  isValid: false
  reason: 'badUsernameOrPassword' | 'passwordExpired' // TODO | 'challengeNeeded'
}

export type PasswordCheckResult = PasswordCheckFailedResult | PasswordCheckSuccessResult
