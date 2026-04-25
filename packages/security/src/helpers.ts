import type { Injector } from '@furystack/inject'
import { PasswordAuthenticator } from './password-authenticator.js'
import { SecurityPolicyManager } from './security-policy-manager.js'
import { defaultSecurityPolicy, SecurityPolicy } from './security-policy.js'

/**
 * Rebinds the {@link SecurityPolicy} on the given injector with the default
 * policy merged with `overrides`.
 *
 * Apply this at application setup before resolving any service that reads
 * the policy — {@link PasswordAuthenticator}, {@link SecurityPolicyManager}
 * or direct `injector.get(SecurityPolicy)` callers. Because those services
 * capture the policy at resolve time, calling `usePasswordPolicy` after
 * they have been resolved has no effect unless you also invalidate them.
 *
 * **Prerequisite:** bind persistent implementations of
 * `PasswordCredentialStore` and `PasswordResetTokenStore` before resolving
 * {@link PasswordAuthenticator}. Their default factories throw on purpose
 * so password data is never silently kept in-memory.
 *
 * @example
 * ```ts
 * usePasswordPolicy(injector, {
 *   passwordExpirationDays: 90,
 *   passwordComplexityRules: [createMinLengthComplexityRule(8)],
 * })
 * ```
 */
export const usePasswordPolicy = (injector: Injector, overrides?: Partial<SecurityPolicy>): void => {
  injector.bind(SecurityPolicy, () => ({ ...defaultSecurityPolicy(), ...overrides }))
  injector.invalidate(SecurityPolicy)
  injector.invalidate(SecurityPolicyManager)
  injector.invalidate(PasswordAuthenticator)
}
