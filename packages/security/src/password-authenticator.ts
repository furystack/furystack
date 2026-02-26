import { useSystemIdentityContext } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import { Injectable, Injected } from '@furystack/inject'
import type { DataSet } from '@furystack/repository'
import { getDataSetFor } from '@furystack/repository'
import { UnauthenticatedError } from './errors/index.js'
import { PasswordComplexityError } from './errors/password-complexity-error.js'
import type { PasswordCheckResult } from './models/index.js'
import { PasswordCredential, PasswordResetToken } from './models/index.js'
import type { PasswordHasher } from './password-hasher.js'
import { SecurityPolicyManager } from './security-policy-manager.js'

@Injectable({ lifetime: 'singleton' })
export class PasswordAuthenticator {
  @Injected((injector) => useSystemIdentityContext({ injector, username: 'PasswordAuthenticator' }))
  declare private readonly systemInjector: Injector

  @Injected((injector) => getDataSetFor(injector, PasswordCredential, 'userName'))
  declare private readonly passwordDataSet: DataSet<PasswordCredential, 'userName'>

  @Injected((injector) => getDataSetFor(injector, PasswordResetToken, 'token'))
  declare private readonly tokenDataSet: DataSet<PasswordResetToken, 'token'>

  @Injected(function (this: PasswordAuthenticator, injector) {
    return injector.getInstance(this.policyManager.policy.hasher)
  })
  declare public readonly hasher: PasswordHasher

  /**
   * @param userName The User's unique name
   * @param plainPassword The plain password to check
   * @returns An object that contains an { isValid } value that indicates if the password is valid
   */
  public async checkPasswordForUser(userName: string, plainPassword: string): Promise<PasswordCheckResult> {
    const entry = await this.passwordDataSet.get(this.systemInjector, userName)
    if (!entry) {
      return {
        isValid: false,
        reason: 'badUsernameOrPassword',
      }
    }
    const result = await this.hasher.verifyCredential(plainPassword, entry)
    if (result.isValid && this.policyManager.hasPasswordExpired(entry)) {
      return {
        isValid: false,
        reason: 'passwordExpired',
      }
    }
    return result
  }

  /**
   * Sets the password for the specific user
   * @param userName The user to set the password for
   * @param lastPassword The last user password
   * @param plainPassword The password as a plain string
   */
  public async setPasswordForUser(userName: string, lastPassword: string, plainPassword: string): Promise<void> {
    const complexityResult = await this.policyManager.matchPasswordComplexityRules(plainPassword)
    if (!complexityResult.match) {
      throw new PasswordComplexityError(complexityResult.errors)
    }

    const lastResult = await this.checkPasswordForUser(userName, lastPassword)
    if (!lastResult.isValid) {
      throw new UnauthenticatedError()
    }
    const newCredential = await this.hasher.createCredential(userName, plainPassword)
    const existing = await this.passwordDataSet.get(this.systemInjector, userName)
    if (existing) {
      await this.passwordDataSet.remove(this.systemInjector, existing.userName)
    }
    await this.passwordDataSet.add(this.systemInjector, newCredential)
  }

  /**
   * Resets the password with a Password Reset token entry
   * @param resetToken The Reset Token value
   * @param plainPassword The new password in plain string
   */
  public async resetPasswordForUser(resetToken: string, plainPassword: string): Promise<void> {
    const token = await this.tokenDataSet.get(this.systemInjector, resetToken)

    if (!token) {
      throw new UnauthenticatedError()
    }

    if (this.policyManager.hasTokenExpired(token)) {
      await this.tokenDataSet.remove(this.systemInjector, resetToken)
      throw new UnauthenticatedError()
    }

    const complexityResult = await this.policyManager.matchPasswordComplexityRules(plainPassword)
    if (!complexityResult.match) {
      throw new PasswordComplexityError(complexityResult.errors)
    }

    const newCredential = await this.hasher.createCredential(token.userName, plainPassword)
    const existing = await this.passwordDataSet.get(this.systemInjector, token.userName)
    if (existing) {
      await this.passwordDataSet.remove(this.systemInjector, existing.userName)
    }
    await this.passwordDataSet.add(this.systemInjector, newCredential)
  }

  @Injected(SecurityPolicyManager)
  declare public policyManager: SecurityPolicyManager
}
