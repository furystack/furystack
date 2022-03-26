import { Constructable, Injectable } from '@furystack/inject'
import { CryptoPasswordHasher } from './crypto-password-hasher'
import { PasswordComplexityRule } from './models'
import { PasswordHasher } from './password-hasher'

@Injectable({ lifetime: 'singleton' })
export class SecurityPolicy {
  /**
   * A Hasher instance for password hash generation
   */
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
