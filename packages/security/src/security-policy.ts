import { defineService, type Token } from '@furystack/inject'
import { CryptoPasswordHasher } from './crypto-password-hasher.js'
import type { PasswordComplexityRule } from './models/password-complexity-rule.js'
import type { PasswordHasher } from './password-hasher.js'

/**
 * Application-wide policy that governs password hashing, complexity rules,
 * expiration and second-factor requirements.
 *
 * The default policy shipped by `@furystack/security` uses
 * {@link CryptoPasswordHasher}, enforces no complexity rules, disables
 * password and reset-token expiration by default and does not require
 * second factor authentication. Override via {@link usePasswordPolicy}.
 */
export type SecurityPolicy = {
  /**
   * Token resolving to the {@link PasswordHasher} used for generating and
   * verifying password credentials.
   */
  hasher: Token<PasswordHasher, 'singleton'>
  /**
   * Ordered list of password complexity rules applied to every new or
   * changed password.
   */
  passwordComplexityRules: PasswordComplexityRule[]
  /**
   * Number of days after which a stored password credential is considered
   * expired. `0` disables expiration entirely.
   */
  passwordExpirationDays: number
  /**
   * Second-factor authentication policy. `'always'` forces a second factor
   * on every login; `'never'` disables it. Trusted-device-aware policies
   * are not yet implemented.
   */
  requireSecondFactor: 'never' | 'always'
  /**
   * Lifetime of a password reset token in seconds.
   */
  resetTokenExpirationSeconds: number
}

/**
 * Returns a fresh copy of the default {@link SecurityPolicy}. Useful as a
 * starting point for `Object.assign`-style overrides or spec fixtures.
 */
export const defaultSecurityPolicy = (): SecurityPolicy => ({
  hasher: CryptoPasswordHasher,
  passwordComplexityRules: [],
  passwordExpirationDays: 0,
  requireSecondFactor: 'never',
  resetTokenExpirationSeconds: 15,
})

/**
 * DI token that resolves the current {@link SecurityPolicy}. Rebind this
 * token via {@link usePasswordPolicy} (preferred) or directly through
 * {@link Injector.bind} to customise the policy per-application or
 * per-scope.
 */
export const SecurityPolicy: Token<SecurityPolicy, 'singleton'> = defineService({
  name: 'furystack/security/SecurityPolicy',
  lifetime: 'singleton',
  factory: () => defaultSecurityPolicy(),
})
