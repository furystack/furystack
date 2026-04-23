import { useSystemIdentityContext } from '@furystack/core'
import { defineService, type Token } from '@furystack/inject'
import { UnauthenticatedError } from './errors/index.js'
import { PasswordComplexityError } from './errors/password-complexity-error.js'
import type { PasswordCheckResult } from './models/index.js'
import { PasswordCredentialDataSet, PasswordResetTokenDataSet } from './password-credential-store.js'
import type { PasswordHasher } from './password-hasher.js'
import { SecurityPolicyManager } from './security-policy-manager.js'

/**
 * Authenticator surface: check stored credentials, rotate passwords and
 * consume reset tokens. All writes are funneled through a system-identity
 * scope so the underlying DataSets skip caller-scoped authorization.
 */
export interface PasswordAuthenticator {
  /** The hasher bound by the active {@link SecurityPolicy}. Exposed for use in tests and migration helpers. */
  readonly hasher: PasswordHasher
  /** The {@link SecurityPolicyManager} resolved at construction. */
  readonly policyManager: SecurityPolicyManager
  /**
   * Verifies that the stored credential for `userName` matches
   * `plainPassword` and honours the policy's expiration rules.
   */
  checkPasswordForUser(userName: string, plainPassword: string): Promise<PasswordCheckResult>
  /**
   * Replaces the stored credential for `userName` with one derived from
   * `plainPassword`. Requires the current `lastPassword` to be valid and
   * `plainPassword` to pass the configured complexity rules.
   */
  setPasswordForUser(userName: string, lastPassword: string, plainPassword: string): Promise<void>
  /**
   * Consumes `resetToken` and rotates the associated user's password to
   * one derived from `plainPassword`. Expired tokens are rejected and
   * cleaned up; bad tokens raise {@link UnauthenticatedError}.
   */
  resetPasswordForUser(resetToken: string, plainPassword: string): Promise<void>
}

/**
 * DI token for the singleton {@link PasswordAuthenticator}.
 *
 * The factory creates a system-identity child scope once (at first
 * resolution) and uses it for every credential mutation. The scope is
 * torn down alongside the owning injector via `onDispose`.
 */
export const PasswordAuthenticator: Token<PasswordAuthenticator, 'singleton'> = defineService({
  name: 'furystack/security/PasswordAuthenticator',
  lifetime: 'singleton',
  factory: ({ inject, injector, onDispose }): PasswordAuthenticator => {
    const policyManager = inject(SecurityPolicyManager)
    const hasher = inject(policyManager.policy.hasher)
    const passwordDataSet = inject(PasswordCredentialDataSet)
    const tokenDataSet = inject(PasswordResetTokenDataSet)
    const systemInjector = useSystemIdentityContext({ injector, username: 'PasswordAuthenticator' })
    onDispose(() => systemInjector[Symbol.asyncDispose]())

    const checkPasswordForUser = async (userName: string, plainPassword: string): Promise<PasswordCheckResult> => {
      const entry = await passwordDataSet.get(systemInjector, userName)
      if (!entry) {
        return { isValid: false, reason: 'badUsernameOrPassword' }
      }
      const result = await hasher.verifyCredential(plainPassword, entry)
      if (result.isValid && policyManager.hasPasswordExpired(entry)) {
        return { isValid: false, reason: 'passwordExpired' }
      }
      return result
    }

    const replaceCredential = async (userName: string, plainPassword: string): Promise<void> => {
      const newCredential = await hasher.createCredential(userName, plainPassword)
      const existing = await passwordDataSet.get(systemInjector, userName)
      if (existing) {
        await passwordDataSet.remove(systemInjector, existing.userName)
      }
      await passwordDataSet.add(systemInjector, newCredential)
    }

    const setPasswordForUser = async (userName: string, lastPassword: string, plainPassword: string): Promise<void> => {
      const complexityResult = await policyManager.matchPasswordComplexityRules(plainPassword)
      if (!complexityResult.match) {
        throw new PasswordComplexityError(complexityResult.errors)
      }
      const lastResult = await checkPasswordForUser(userName, lastPassword)
      if (!lastResult.isValid) {
        throw new UnauthenticatedError()
      }
      await replaceCredential(userName, plainPassword)
    }

    const resetPasswordForUser = async (resetToken: string, plainPassword: string): Promise<void> => {
      const token = await tokenDataSet.get(systemInjector, resetToken)
      if (!token) {
        throw new UnauthenticatedError()
      }
      if (policyManager.hasTokenExpired(token)) {
        await tokenDataSet.remove(systemInjector, resetToken)
        throw new UnauthenticatedError()
      }
      const complexityResult = await policyManager.matchPasswordComplexityRules(plainPassword)
      if (!complexityResult.match) {
        throw new PasswordComplexityError(complexityResult.errors)
      }
      await replaceCredential(token.userName, plainPassword)
    }

    return {
      hasher,
      policyManager,
      checkPasswordForUser,
      setPasswordForUser,
      resetPasswordForUser,
    }
  },
})
