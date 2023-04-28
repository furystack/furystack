import type { Constructable } from '@furystack/inject'
import { Injectable } from '@furystack/inject'
import { CryptoPasswordHasher } from './crypto-password-hasher.js'
import type { PasswordComplexityRule } from './models/password-complexity-rule.js'
import type { PasswordHasher } from './password-hasher.js'

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
