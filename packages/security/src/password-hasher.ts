import type { PasswordCheckResult, PasswordCredential } from './models/index.js'

/**
 * Abstraction for hashing and verifying password credentials.
 *
 * Implementations are DI tokens that resolve to an object conforming to this
 * interface. The default implementation shipped by `@furystack/security` is
 * {@link CryptoPasswordHasher}; applications can swap in an alternative by
 * binding the {@link SecurityPolicy.hasher} token (for example, to use a
 * stronger KDF or a managed hashing service).
 */
export interface PasswordHasher {
  /**
   * Produces a fresh credential entry for the given user name and plain
   * password. The returned record is suitable for persistence in the
   * credential store.
   */
  createCredential(userName: string, password: string): Promise<PasswordCredential>

  /**
   * Verifies a plain password against a stored credential. Implementations
   * should be constant-time relative to the password to avoid timing leaks.
   */
  verifyCredential(password: string, credential: PasswordCredential): Promise<PasswordCheckResult>
}
