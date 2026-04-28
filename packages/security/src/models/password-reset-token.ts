/**
 * Single-use password reset token. `token` is the URL-safe identifier
 * shared with the user (e.g. via email). `createdAt` (ISO 8601) is the
 * expiration anchor honoured by `SecurityPolicyManager.hasTokenExpired`.
 */
export class PasswordResetToken {
  declare userName: string
  declare token: string
  declare createdAt: string
}
