import type { Injector } from '@furystack/inject'
import { SecurityPolicy } from './security-policy.js'

/**
 * Sets up the @furystack/security with the provided settings.
 *
 * **Prerequisite:** DataSets for `PasswordCredential` and `PasswordResetToken` must be registered
 * via `getRepository(injector).createDataSet()` before `PasswordAuthenticator` is instantiated,
 * as it resolves these DataSets through `@Injected`.
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
}
