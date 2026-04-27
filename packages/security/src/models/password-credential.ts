import type { PasswordHasher } from '../password-hasher.js'

/**
 * Persisted password credential. `passwordHash` and `salt` are produced by
 * the configured {@link PasswordHasher}; `creationDate` (ISO 8601 string)
 * is the source of truth for password-expiration policies.
 */
export class PasswordCredential {
  declare userName: string
  declare passwordHash: string
  declare salt: string
  declare creationDate: string
}
