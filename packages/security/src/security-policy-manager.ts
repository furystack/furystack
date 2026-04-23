import { defineService, type Token } from '@furystack/inject'
import type { PasswordCredential, PasswordResetToken } from './models/index.js'
import { SecurityPolicy } from './security-policy.js'

/**
 * Result of a successful password complexity check — no rule reported a
 * failure.
 */
export type PasswordComplexityMatch = { match: true }

/**
 * Result of a failed password complexity check along with the individual
 * rule failures for user-facing reporting.
 */
export type PasswordComplexityMismatch = {
  match: false
  errors: Array<{ message: string; rule: string }>
}

/**
 * Runtime checker for the active {@link SecurityPolicy}. Applies complexity
 * rules to candidate passwords and determines whether stored credentials
 * and reset tokens have expired.
 */
export interface SecurityPolicyManager {
  /** The active {@link SecurityPolicy} snapshot captured at resolve time. */
  readonly policy: SecurityPolicy
  /**
   * Evaluates every complexity rule against `password` and aggregates the
   * result. `match: true` means the password is acceptable.
   */
  matchPasswordComplexityRules(password: string): Promise<PasswordComplexityMatch | PasswordComplexityMismatch>
  /**
   * Returns `true` when `credential.creationDate` plus
   * `policy.passwordExpirationDays` is in the past. Always `false` when the
   * policy sets `passwordExpirationDays` to `0`.
   */
  hasPasswordExpired(credential: PasswordCredential): boolean
  /**
   * Returns `true` when `token.createdAt` plus
   * `policy.resetTokenExpirationSeconds` is in the past. Always `false`
   * when the policy sets `resetTokenExpirationSeconds` to `0`.
   */
  hasTokenExpired(token: PasswordResetToken): boolean
}

const addDays = (base: Date, days: number): Date => {
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result
}

const addSeconds = (base: Date, seconds: number): Date => {
  const result = new Date(base)
  result.setSeconds(result.getSeconds() + seconds)
  return result
}

/**
 * DI token for the singleton {@link SecurityPolicyManager}. Resolves the
 * current {@link SecurityPolicy} once and closes over it for the lifetime
 * of the owning injector.
 */
export const SecurityPolicyManager: Token<SecurityPolicyManager, 'singleton'> = defineService({
  name: 'furystack/security/SecurityPolicyManager',
  lifetime: 'singleton',
  factory: ({ inject }): SecurityPolicyManager => {
    const policy = inject(SecurityPolicy)
    return {
      policy,
      matchPasswordComplexityRules: async (password) => {
        const outcomes = await Promise.all(policy.passwordComplexityRules.map((rule) => rule.check(password)))
        const failed = outcomes.filter((outcome) => outcome.success === false)
        if (failed.length === 0) {
          return { match: true }
        }
        return {
          match: false,
          errors: failed.map((outcome) =>
            outcome.success === false ? { message: outcome.message, rule: outcome.rule } : { message: '', rule: '' },
          ),
        }
      },
      hasPasswordExpired: (credential) => {
        if (!policy.passwordExpirationDays) {
          return false
        }
        const expiration = addDays(new Date(credential.creationDate), policy.passwordExpirationDays)
        return new Date() > expiration
      },
      hasTokenExpired: (token) => {
        if (!policy.resetTokenExpirationSeconds) {
          return false
        }
        const expiration = addSeconds(new Date(token.createdAt), policy.resetTokenExpirationSeconds)
        return new Date() > expiration
      },
    }
  },
})
