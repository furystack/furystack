import { StoreManager } from '@furystack/core'
import { Injectable, Injected, Injector } from '@furystack/inject'
import { SecurityPolicyManager } from './security-policy-manager'
import { UnauthenticatedError } from './errors'
import { PasswordCheckResult, PasswordCredential, PasswordResetToken } from './models'
import { PasswordComplexityError } from './errors/password-complexity-error'

@Injectable({ lifetime: 'singleton' })
export class PasswordAuthenticator {
  private readonly getPasswordStore = () =>
    this.injector.getInstance(StoreManager).getStoreFor(PasswordCredential, 'userName')

  private readonly getTokenStore = () =>
    this.injector.getInstance(StoreManager).getStoreFor(PasswordResetToken, 'token')

  public readonly getHasher = () => this.injector.getInstance(this.policyManager.policy.hasher)

  /**
   * @param userName The User's unique name
   * @param plainPassword The plain password to check
   * @returns An object that contains an { isValid } value that indicates if the password is valid
   */
  public async checkPasswordForUser(userName: string, plainPassword: string): Promise<PasswordCheckResult> {
    const entry = await this.getPasswordStore().get(userName)
    if (!entry) {
      return {
        isValid: false,
        reason: 'badUsernameOrPassword',
      }
    }
    const result = await this.getHasher().verifyCredential(plainPassword, entry)
    if (result.isValid && this.policyManager.hasPasswordExpired(entry)) {
      return {
        isValid: false,
        reason: 'passwordExpired',
      }
    }
    return result
  }

  /**
   *
   * Sets the password for the specific user
   *
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
    const store = this.getPasswordStore()
    const newCredential = await this.getHasher().createCredential(userName, plainPassword)
    const existing = await store.get(userName)
    existing && (await store.remove(existing.userName))
    await store.add(newCredential)
  }

  /**
   * Resets the password with a Password Reset token entry
   *
   * @param resetToken The Reset Token value
   * @param plainPassword The new password in plain string
   */
  public async resetPasswordForUser(resetToken: string, plainPassword: string): Promise<void> {
    const token = await this.getTokenStore().get(resetToken)

    if (!token) {
      throw new UnauthenticatedError()
    }

    if (this.policyManager.hasTokenExpired(token)) {
      await this.getTokenStore().remove(resetToken) // clean up token
      throw new UnauthenticatedError()
    }

    const complexityResult = await this.policyManager.matchPasswordComplexityRules(plainPassword)
    if (!complexityResult.match) {
      throw new PasswordComplexityError(complexityResult.errors)
    }

    const newCredential = await this.getHasher().createCredential(token.userName, plainPassword)
    const store = this.getPasswordStore()
    const existing = await store.get(token.userName)
    existing && (await store.remove(existing.userName))
    await store.add(newCredential)
  }

  @Injected(Injector)
  private readonly injector!: Injector

  @Injected(SecurityPolicyManager)
  public policyManager!: SecurityPolicyManager
}
