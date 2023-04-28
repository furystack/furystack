import { Injectable, Injected } from '@furystack/inject'
import type { PasswordCredential, PasswordResetToken } from './models/index.js'
import { SecurityPolicy } from './security-policy.js'

@Injectable({ lifetime: 'singleton' })
export class SecurityPolicyManager {
  /**
   * @param password The Plain password string
   * @returns if the password matches the complexity rules
   */
  public async matchPasswordComplexityRules(password: string) {
    const result = await Promise.all(this.policy.passwordComplexityRules.map((rule) => rule.check(password)))
    const failed = result.filter((r) => r.success === false)
    if (failed.length) {
      return {
        match: false as const,
        errors: failed.map((f) => f.success === false && { message: f.message, rule: f.rule }) as Array<{
          message: string
          rule: string
        }>,
      }
    }

    return {
      match: true as const,
    }
  }

  public hasPasswordExpired(credential: PasswordCredential) {
    if (!this.policy.passwordExpirationDays) {
      return false
    }
    const credentialExpiration = new Date(credential.creationDate)
    credentialExpiration.setDate(credentialExpiration.getDate() + this.policy.passwordExpirationDays)
    const now = new Date()
    return now > credentialExpiration
  }

  public hasTokenExpired(token: PasswordResetToken) {
    if (!this.policy.resetTokenExpirationSeconds) {
      return false
    }
    const tokenExpiration = new Date(token.createdAt)
    tokenExpiration.setSeconds(tokenExpiration.getSeconds() + this.policy.resetTokenExpirationSeconds)
    const now = new Date()
    return now > tokenExpiration
  }

  @Injected(SecurityPolicy)
  public readonly policy!: SecurityPolicy
}
