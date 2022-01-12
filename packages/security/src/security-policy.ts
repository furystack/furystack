import { Constructable, Injectable } from '@furystack/inject'
import { CryptoPasswordHasher, PasswordComplexityRule, PasswordHasher } from '.'

@Injectable({ lifetime: 'singleton' })
export class SecurityPolicy {
  hasher: Constructable<PasswordHasher> = CryptoPasswordHasher

  /**
   * Array of password complexity rules to apply
   */
  passwordComplexityRules: PasswordComplexityRule[] = []

  /**
   * The password expiration in days
   */
  passwordExpirationDays = 0

  /**
   * Defines if the login needs a second factor authentication
   */
  requireSecondFactor: 'never' | 'always' = 'never' // TODO - Challenge based on trusted devices

  /**
   * The Password Reset Token expiration in seconds
   */
  resetTokenExpirationSeconds = 15
}
