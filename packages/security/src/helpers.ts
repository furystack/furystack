import { Injector } from '@furystack/inject'
import { SecurityPolicy } from './security-policy'

/**
 * Sets up the @furystack/security with the provided settings
 *
 * @param injector The Injector instance
 * @param {Partial<SecurityPolicy>} policy The security policy to use
 */
export const usePasswordPolicy = (injector: Injector, policy?: Partial<SecurityPolicy>) => {
  const plainPolicy = new SecurityPolicy()
  policy && Object.assign(plainPolicy, policy)
  injector.setExplicitInstance(plainPolicy, SecurityPolicy)
}
