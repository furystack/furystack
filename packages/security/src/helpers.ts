import type { Injector } from '@furystack/inject'
import { getRepository } from '@furystack/repository'
import { PasswordCredential, PasswordResetToken } from './models/index.js'
import { SecurityPolicy } from './security-policy.js'

/**
 * Sets up the @furystack/security with the provided settings.
 * Creates Repository DataSets for PasswordCredential (required) and PasswordResetToken
 * (if its physical store is registered) so that all access goes through the authorized DataSet layer.
 *
 * @param injector The Injector instance
 * @param policy The security policy to use
 */
export const usePasswordPolicy = (injector: Injector, policy?: Partial<SecurityPolicy>) => {
  const plainPolicy = new SecurityPolicy()

  if (policy) {
    Object.assign(plainPolicy, policy)
  }

  injector.setExplicitInstance(plainPolicy, SecurityPolicy)

  const repo = getRepository(injector)
  repo.createDataSet(PasswordCredential, 'userName')
  try {
    repo.createDataSet(PasswordResetToken, 'token')
  } catch {
    // PasswordResetToken store not registered — password reset functionality not in use
  }
}
