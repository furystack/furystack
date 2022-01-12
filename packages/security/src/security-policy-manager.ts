import { Injectable } from '@furystack/inject'
import { PasswordCredential } from '.'

import { SecurityPolicy } from './security-policy'

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
    const credentialExpiration = new Date(credential.creationDate)
    credentialExpiration.setDate(credentialExpiration.getDate() + this.policy.passwordExpirationDays)
    const now = new Date()
    return now < credentialExpiration
  }

  /**
   * @param policy The related Password Policy object
   */
  constructor(public readonly policy: SecurityPolicy) {}
}
